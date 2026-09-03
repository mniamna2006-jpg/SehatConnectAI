// scripts/init-db.js
// Creates all tables (schema.sql) and seeds the two demo login accounts,
// replacing the hardcoded DEMO = {admin/admin123, staff/staff123} object
// that used to live in index.html.
//
// Usage:  npm run db:init
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

async function main() {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running schema.sql ...');
  await pool.query(schemaSql);

  console.log('Seeding demo users (admin/admin123, staff/staff123) ...');
  const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'staff', password: 'staff123', role: 'staff' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [u.username, hash, u.role]
    );
  }

  console.log('Done. Change these demo passwords before going live.');
  await pool.end();
}

main().catch((err) => {
  console.error('DB init failed:', err);
  process.exit(1);
});
