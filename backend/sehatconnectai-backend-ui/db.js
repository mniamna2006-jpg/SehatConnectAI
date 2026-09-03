// db.js — single shared PostgreSQL connection pool
require('dotenv').config();
const { Pool } = require('pg');

// Supports either a single DATABASE_URL (Render/Railway/Heroku/Supabase style)
// or discrete PG* variables (local Postgres / most VPS setups).
const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      // Most managed Postgres providers require SSL; set PGSSL=false locally if needed.
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'sehatconnectai',
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  // Handles idle client errors so one bad connection doesn't crash the server
  console.error('Unexpected PostgreSQL client error:', err.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

async function testConnection() {
  const res = await pool.query('SELECT NOW() AS now');
  return res.rows[0].now;
}

module.exports = { pool, query, getClient, testConnection };
