# Hospital Module — PostgreSQL edition

Same dashboard as the MySQL edition, but backed by PostgreSQL instead.
`server.js` serves `login.html` / `hospital-module.html` and reads/writes
real data through `/api/state`. Every open tab polls the database every
4 seconds, so changes made by one user show up for everyone else without
a refresh.

## 1. Create the database

`schema.sql` includes the `CREATE DATABASE` statement, but PostgreSQL
requires you to be connected to a *different* database to run it, and then
reconnect before creating tables.

**Using pgAdmin:**
1. Connect to your server → right-click **Databases** → **Query Tool**
   (this runs against the default `postgres` database).
2. Paste and run just the first line: `CREATE DATABASE hospital_module;`
3. In the left tree, find the new `hospital_module` database → open a
   **new Query Tool** on it.
4. Open `schema.sql`, select everything **below** the `CREATE DATABASE`
   line, and execute (F5).

**Using psql:**
```
psql -U postgres -c "CREATE DATABASE hospital_module;"
psql -U postgres -d hospital_module -f schema.sql
```
(The second command will also try to run `CREATE DATABASE` again and
error harmlessly if you pasted the whole file — that's fine, ignore it,
or just delete that one line from a local copy first.)

## 2. Configure the backend

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Set `DB_PASSWORD` to your actual PostgreSQL password.

## 3. Install and run

```
npm install
npm start
```

You should see:
```
Hospital Module (PostgreSQL) running at http://localhost:4001
Open http://localhost:4001/login.html to sign in.
```

(Note the port is 4001, not 4000 — that's so you can run the MySQL and
PostgreSQL editions side by side without a conflict.)

## 4. Use it

Open **http://localhost:4001/login.html** in your browser.

- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`

Every action goes through the `/api/state` endpoint into PostgreSQL — you
can confirm it in pgAdmin's Query Tool with `SELECT * FROM appointments;`
etc.

## Folder structure

```
hospital-postgres-backend/
├── server.js         ← Express API (auth + read/write state)
├── schema.sql         ← run this once (see step 1 above)
├── package.json
├── .env.example        ← copy to .env and fill in your Postgres password
└── public/
    ├── login.html         ← calls POST /api/auth/login
    └── hospital-module.html  ← calls GET/PUT /api/state
```

## Notes

- Passwords in `users` are stored in plain text for local/demo purposes.
  For anything beyond your own machine, hash them (e.g. with `bcrypt`)
  before storing and compare hashes on login instead.
- The `/api/state` endpoint replaces all department/doctor/staff/patient/
  appointment/queue/notification rows on every save — simple and reliable
  at this dashboard's scale. For a larger system, move to per-entity REST
  endpoints instead.
