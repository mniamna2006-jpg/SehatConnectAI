// Hospital Module — PostgreSQL backend
// Serves the login.html / hospital-module.html frontend AND the /api endpoints
// that read/write real data in PostgreSQL.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 4001;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_module'
});

function newId(prefix){
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

// ---------- AUTH ----------
app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ success:false, message:'Username, password, and role are required.' });
  }
  try{
    const result = await pool.query(
      'SELECT id, username, role FROM users WHERE username = $1 AND password = $2 AND role = $3 LIMIT 1',
      [username, password, role]
    );
    if (result.rows.length === 0){
      return res.status(401).json({ success:false, message:'Invalid username or password.' });
    }
    return res.json({ success:true, username: result.rows[0].username, role: result.rows[0].role });
  }catch(err){
    console.error('Login error:', err.message);
    return res.status(500).json({ success:false, message:'Server error during login.' });
  }
});

// ---------- READ FULL STATE ----------
app.get('/api/state', async (req, res) => {
  const client = await pool.connect();
  try{
    const profileRes = await client.query('SELECT * FROM hospital_profile WHERE id = $1', ['profile']);
    const brandingRes = await client.query('SELECT * FROM branding WHERE id = $1', ['branding']);
    const departmentsRes = await client.query('SELECT id, name, description, head FROM departments');
    const doctorsRes = await client.query(
      `SELECT id, name, specialization, department_id AS "departmentId", phone,
              photo_initials AS "photoInitials", availability, schedule
       FROM doctors`
    );
    const staffRes = await client.query(
      `SELECT id, name, role, department_id AS "departmentId", shift, phone FROM staff`
    );
    const patientsRes = await client.query('SELECT id, name, phone, age FROM patients');
    const appointmentsRes = await client.query(
      `SELECT id, patient_name AS "patientName", doctor_id AS "doctorId", department_id AS "departmentId",
              TO_CHAR(appt_date, 'YYYY-MM-DD') AS date, appt_time AS time, status
       FROM appointments`
    );
    const queueRes = await client.query(
      `SELECT id, queue_num AS num, patient_name AS "patientName", doctor_id AS "doctorId", status, added_at AS "addedAt" FROM queue`
    );
    const notificationsRes = await client.query(
      `SELECT id, text, created_at AS time FROM notifications ORDER BY created_at DESC LIMIT 50`
    );

    const profileRow = profileRes.rows[0];
    const brandingRow = brandingRes.rows[0];

    res.json({
      profile: profileRow ? {
        name: profileRow.name, address: profileRow.address, phone: profileRow.phone,
        email: profileRow.email, hours: profileRow.hours
      } : {},
      branding: brandingRow ? {
        primary: brandingRow.primary_color, secondary: brandingRow.secondary_color, logoText: brandingRow.logo_text
      } : {},
      departments: departmentsRes.rows,
      doctors: doctorsRes.rows,
      staff: staffRes.rows,
      patients: patientsRes.rows,
      appointments: appointmentsRes.rows,
      queue: queueRes.rows,
      notifications: notificationsRes.rows
    });
  }catch(err){
    console.error('GET /api/state error:', err.message);
    res.status(500).json({ message: 'Could not read data from PostgreSQL.' });
  }finally{
    client.release();
  }
});

// ---------- WRITE FULL STATE ----------
// Simplest reliable sync strategy for this dashboard's scale: replace child
// tables wholesale inside one transaction, in FK-safe order.
app.put('/api/state', async (req, res) => {
  const s = req.body || {};
  const client = await pool.connect();
  try{
    await client.query('BEGIN');

    if (s.profile){
      await client.query(
        `INSERT INTO hospital_profile (id, name, address, phone, email, hours)
         VALUES ('profile', $1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name=$1, address=$2, phone=$3, email=$4, hours=$5`,
        [s.profile.name, s.profile.address, s.profile.phone, s.profile.email, s.profile.hours]
      );
    }
    if (s.branding){
      await client.query(
        `INSERT INTO branding (id, primary_color, secondary_color, logo_text)
         VALUES ('branding', $1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET primary_color=$1, secondary_color=$2, logo_text=$3`,
        [s.branding.primary, s.branding.secondary, s.branding.logoText]
      );
    }

    // Delete children before parents to respect foreign keys
    await client.query('DELETE FROM queue');
    await client.query('DELETE FROM appointments');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM doctors');
    await client.query('DELETE FROM staff');
    await client.query('DELETE FROM patients');
    await client.query('DELETE FROM departments');

    for (const d of (s.departments || [])){
      await client.query(
        'INSERT INTO departments (id, name, description, head) VALUES ($1, $2, $3, $4)',
        [d.id || newId('dep'), d.name, d.description || '', d.head || '']
      );
    }
    for (const d of (s.doctors || [])){
      await client.query(
        `INSERT INTO doctors (id, name, specialization, department_id, phone, photo_initials, availability, schedule)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [d.id || newId('doc'), d.name, d.specialization || '', d.departmentId || null, d.phone || '',
         d.photoInitials || '', d.availability || 'available', JSON.stringify(d.schedule || {})]
      );
    }
    for (const st of (s.staff || [])){
      await client.query(
        'INSERT INTO staff (id, name, role, department_id, shift, phone) VALUES ($1, $2, $3, $4, $5, $6)',
        [st.id || newId('stf'), st.name, st.role || '', st.departmentId || null, st.shift || '', st.phone || '']
      );
    }
    for (const p of (s.patients || [])){
      await client.query(
        'INSERT INTO patients (id, name, phone, age) VALUES ($1, $2, $3, $4)',
        [p.id || newId('pat'), p.name, p.phone || '', p.age || null]
      );
    }
    for (const a of (s.appointments || [])){
      await client.query(
        `INSERT INTO appointments (id, patient_name, doctor_id, department_id, appt_date, appt_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [a.id || newId('apt'), a.patientName, a.doctorId || null, a.departmentId || null, a.date, a.time || '', a.status || 'pending']
      );
    }
    for (const q of (s.queue || [])){
      await client.query(
        'INSERT INTO queue (id, queue_num, patient_name, doctor_id, status, added_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [q.id || newId('q'), q.num || 0, q.patientName, q.doctorId || null, q.status || 'waiting', q.addedAt || Date.now()]
      );
    }
    for (const n of (s.notifications || []).slice(0, 50)){
      await client.query(
        'INSERT INTO notifications (id, text, created_at) VALUES ($1, $2, $3)',
        [n.id || newId('ntf'), n.text, n.time || Date.now()]
      );
    }

    await client.query('COMMIT');
    res.json({ success:true });
  }catch(err){
    await client.query('ROLLBACK');
    console.error('PUT /api/state error:', err.message);
    res.status(500).json({ success:false, message:'Could not save data to PostgreSQL.' });
  }finally{
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Hospital Module (PostgreSQL) running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/login.html to sign in.`);
});
