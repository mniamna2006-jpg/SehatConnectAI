// server.js — Express API + static frontend host for SehatConnectAI
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------------------------------------------
// AUTH — replaces the hardcoded DEMO={admin:{...},staff:{...}} object
// ------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, role } = req.body || {};
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username, password and role are required' });
    }

    const { rows } = await pool.query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1 AND role = $2',
      [username, role]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid username or password.' });

    return res.json({ success: true, user: user.username, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ------------------------------------------------------------------
// STATE — GET assembles the exact JSON shape hospital-module.html
// already expects (state.profile, state.branding, state.departments...)
// ------------------------------------------------------------------
app.get('/api/state', async (req, res) => {
  try {
    const [profileR, brandingR, deptR, docR, staffR, patR, apptR, queueR, notifR] = await Promise.all([
      pool.query('SELECT * FROM hospital_profile WHERE id = 1'),
      pool.query('SELECT * FROM branding WHERE id = 1'),
      pool.query('SELECT * FROM departments ORDER BY created_at ASC'),
      pool.query('SELECT * FROM doctors ORDER BY created_at ASC'),
      pool.query('SELECT * FROM staff ORDER BY created_at ASC'),
      pool.query('SELECT * FROM patients ORDER BY created_at ASC'),
      pool.query('SELECT * FROM appointments ORDER BY created_at ASC'),
      pool.query('SELECT * FROM queue ORDER BY position ASC'),
      pool.query('SELECT * FROM notifications ORDER BY time DESC'),
    ]);

    const p = profileR.rows[0] || {};
    const b = brandingR.rows[0] || {};

    const state = {
      profile: {
        name: p.name, address: p.address, phone: p.phone, hours: p.hours,
        email: p.email, website: p.website, emergency: p.emergency,
        reception: p.reception, description: p.description,
        facilities: p.facilities, services: p.services,
      },
      branding: {
        primary: b.primary_color, secondary: b.secondary_color, logoText: b.logo_text,
      },
      departments: deptR.rows.map((d) => ({
        id: d.id, name: d.name, description: d.description, head: d.head,
      })),
      doctors: docR.rows.map((d) => ({
        id: d.id, name: d.name, specialization: d.specialization,
        departmentId: d.department_id, phone: d.phone, photoInitials: d.photo_initials,
        availability: d.availability, schedule: d.schedule || {},
      })),
      staff: staffR.rows.map((s) => ({
        id: s.id, name: s.name, role: s.role, departmentId: s.department_id,
        shift: s.shift, phone: s.phone,
      })),
      patients: patR.rows.map((p2) => ({
        id: p2.id, name: p2.name, phone: p2.phone, age: p2.age,
      })),
      appointments: apptR.rows.map((a) => ({
        id: a.id, patientName: a.patient_name, patientId: a.patient_id,
        doctorId: a.doctor_id, departmentId: a.department_id,
        date: toDateStr(a.date), time: a.time, status: a.status,
      })),
      queue: queueR.rows.map((q) => ({
        id: q.id, num: q.num, patientName: q.patient_name,
        doctorId: q.doctor_id, status: q.status, addedAt: Number(q.added_at),
      })),
      notifications: notifR.rows.map((n) => ({
        id: n.id, text: n.text, time: Number(n.time),
      })),
    };

    res.json(state);
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Failed to load state.' });
  }
});

// ------------------------------------------------------------------
// STATE — PUT persists the full snapshot the frontend already builds
// in memory. Runs as one transaction: wipe + reinsert each child table.
// (Matches the app's existing "save the whole state blob" model, just
// backed by real relational tables instead of a JSON blob.)
// ------------------------------------------------------------------
app.put('/api/state', async (req, res) => {
  const s = req.body || {};
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (s.profile) {
      const p = s.profile;
      await client.query(
        `INSERT INTO hospital_profile (id,name,address,phone,hours,email,website,emergency,reception,description,facilities,services,updated_at)
         VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, address=EXCLUDED.address, phone=EXCLUDED.phone, hours=EXCLUDED.hours,
           email=EXCLUDED.email, website=EXCLUDED.website, emergency=EXCLUDED.emergency,
           reception=EXCLUDED.reception, description=EXCLUDED.description,
           facilities=EXCLUDED.facilities, services=EXCLUDED.services, updated_at=now()`,
        [p.name, p.address, p.phone, p.hours, p.email, p.website, p.emergency, p.reception, p.description, p.facilities, p.services]
      );
    }

    if (s.branding) {
      const b = s.branding;
      await client.query(
        `INSERT INTO branding (id, primary_color, secondary_color, logo_text, updated_at)
         VALUES (1,$1,$2,$3, now())
         ON CONFLICT (id) DO UPDATE SET
           primary_color=EXCLUDED.primary_color, secondary_color=EXCLUDED.secondary_color,
           logo_text=EXCLUDED.logo_text, updated_at=now()`,
        [b.primary, b.secondary, b.logoText]
      );
    }

    // Departments must be replaced before doctors/staff (FK dependency),
    // and appointments/queue before doctors too (FK dependency the other way),
    // so clear children first, then parents, then reinsert parents -> children.
    await client.query('DELETE FROM appointments');
    await client.query('DELETE FROM queue');
    await client.query('DELETE FROM doctors');
    await client.query('DELETE FROM staff');
    await client.query('DELETE FROM patients');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM departments');

    for (const d of s.departments || []) {
      await client.query(
        'INSERT INTO departments (id, name, description, head) VALUES ($1,$2,$3,$4)',
        [d.id, d.name, d.description || null, d.head || null]
      );
    }

    for (const d of s.doctors || []) {
      await client.query(
        `INSERT INTO doctors (id,name,specialization,department_id,phone,photo_initials,availability,schedule)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [d.id, d.name, d.specialization || null, d.departmentId || null, d.phone || null,
         d.photoInitials || null, d.availability || 'available', JSON.stringify(d.schedule || {})]
      );
    }

    for (const st of s.staff || []) {
      await client.query(
        'INSERT INTO staff (id,name,role,department_id,shift,phone) VALUES ($1,$2,$3,$4,$5,$6)',
        [st.id, st.name, st.role || null, st.departmentId || null, st.shift || null, st.phone || null]
      );
    }

    for (const pnt of s.patients || []) {
      await client.query(
        'INSERT INTO patients (id,name,phone,age) VALUES ($1,$2,$3,$4)',
        [pnt.id, pnt.name, pnt.phone || null, pnt.age || null]
      );
    }

    for (const a of s.appointments || []) {
      await client.query(
        `INSERT INTO appointments (id,patient_name,patient_id,doctor_id,department_id,date,time,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [a.id, a.patientName, a.patientId || null, a.doctorId || null, a.departmentId || null,
         a.date, a.time, a.status || 'pending']
      );
    }

    let pos = 0;
    for (const q of s.queue || []) {
      await client.query(
        'INSERT INTO queue (id,num,patient_name,doctor_id,status,added_at,position) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [q.id, q.num || 0, q.patientName, q.doctorId || null, q.status || 'waiting', q.addedAt || Date.now(), pos++]
      );
    }

    for (const n of s.notifications || []) {
      await client.query('INSERT INTO notifications (id,text,time) VALUES ($1,$2,$3)', [n.id, n.text, n.time || Date.now()]);
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /api/state error:', err);
    res.status(500).json({ error: 'Failed to save state.' });
  } finally {
    client.release();
  }
});

function toDateStr(d) {
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

app.get('/api/health', async (req, res) => {
  try {
    const now = await testConnection();
    res.json({ ok: true, db_time: now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`SehatConnectAI backend running on http://localhost:${PORT}`);
});
