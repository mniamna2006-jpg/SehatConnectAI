# SehatConnectAI — PostgreSQL Backend

A real PostgreSQL-backed Express API for the `index.html` / `hospital-module.html`
admin & staff portal. The frontend previously stored everything as one JSON blob
in `window.storage` (an artifact-only API) and checked logins against a hardcoded
`DEMO = { admin: {...}, staff: {...} }` object. Both are now replaced with:

- **PostgreSQL tables** — `departments`, `doctors`, `staff`, `patients`,
  `appointments`, `queue`, `notifications`, `hospital_profile`, `branding`, `users`.
- **A real login endpoint** — `POST /api/auth/login`, checking bcrypt-hashed
  passwords in the `users` table.
- **State sync endpoints** — `GET /api/state` and `PUT /api/state`, which read/write
  the exact same JSON shape the frontend already works with, so almost none of the
  existing UI logic had to change.

## 1. Install PostgreSQL & create a database

```bash
# Ubuntu/Debian example
sudo apt install postgresql
sudo -u postgres psql -c "CREATE DATABASE sehatconnectai;"
sudo -u postgres psql -c "CREATE USER hospital_app WITH PASSWORD 'change_me';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sehatconnectai TO hospital_app;"
```

(Or use a managed Postgres — Supabase, Neon, Railway, Render all work fine; just
grab the connection string they give you.)

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — either set `DATABASE_URL` (managed Postgres) **or** the discrete
`PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE` vars (local Postgres).

## 3. Install dependencies & initialize the database

```bash
npm install
npm run db:init
```

`db:init` runs `schema.sql` (creates all tables + seeds the 3 default departments)
and creates two demo accounts:

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | admin |
| staff    | staff123  | staff |

**Change these passwords before going live** — see "Managing users" below.

## 4. Run the server

```bash
npm start
```

Visit `http://localhost:3000` — this serves `public/index.html` (login) and
`public/hospital-module.html` (the dashboard), both already wired to the API.

## How the frontend was changed

- `index.html`: `attemptLogin()` now calls `POST /api/auth/login` instead of
  comparing against the hardcoded `DEMO` object.
- `hospital-module.html`: `loadState()` / `saveState()` / `pollSync()` now call
  `GET /api/state` and `PUT /api/state` instead of `window.storage.get/set`.
  Every existing feature (departments, doctors, schedules, appointments, queue,
  staff, patients, notifications) keeps working exactly as before — they all
  operate on the same in-memory `state` object, which now round-trips through
  PostgreSQL instead of the artifact key-value store.

## API reference

| Method | Path               | Purpose                                      |
|--------|--------------------|-----------------------------------------------|
| POST   | `/api/auth/login`  | `{username, password, role}` → `{success, user, role}` |
| GET    | `/api/state`       | Returns the full app state (all entities)     |
| PUT    | `/api/state`       | Replaces the full app state in one transaction|
| GET    | `/api/health`      | DB connectivity check                         |

`PUT /api/state` does a full transactional replace (matches the app's existing
"save the whole snapshot" model). For a small clinic's data volume this is simple
and safe; if the dataset grows large, switch to per-entity endpoints
(`POST/PUT/DELETE /api/doctors/:id`, etc.) instead of full-state swaps.

## Managing users

There's no admin UI for creating users yet. Add one directly:

```js
// node -e in the project root
const bcrypt = require('bcryptjs');
const { pool } = require('./db');
(async () => {
  const hash = await bcrypt.hash('a-strong-password', 10);
  await pool.query(
    'INSERT INTO users (username, password_hash, role) VALUES ($1,$2,$3)',
    ['new_admin_username', hash, 'admin']
  );
  await pool.end();
})();
```

## Project structure

```
backend/
├── server.js          # Express app + all routes
├── db.js              # PostgreSQL connection pool
├── schema.sql          # Table definitions + seed data
├── scripts/
│   └── init-db.js     # Runs schema.sql, seeds demo users
├── package.json
├── .env.example
└── public/
    ├── index.html          # Login (now calls /api/auth/login)
    └── hospital-module.html # Dashboard (now calls /api/state)
```
