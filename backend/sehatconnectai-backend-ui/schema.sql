-- ============================================================
-- SehatConnectAI — PostgreSQL schema
-- Mirrors the data model already used by hospital-module.html
-- (state.profile, state.branding, state.departments, state.doctors,
--  state.staff, state.patients, state.appointments, state.queue,
--  state.notifications) plus a real users table for login.
--
-- IDs are TEXT (not UUID) because the frontend already generates its
-- own ids client-side via uid(prefix) -> "dep_ab12xy9". Keeping that
-- format means the existing frontend code needs no id-handling changes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- used for users.id only

-- ---------- USERS (replaces the hardcoded DEMO credentials) ----------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','staff')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- HOSPITAL PROFILE (single row) ----------
CREATE TABLE IF NOT EXISTS hospital_profile (
  id          SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name        TEXT NOT NULL DEFAULT 'SehatConnectAI Hospital',
  address     TEXT,
  phone       TEXT,
  hours       TEXT,
  email       TEXT,
  website     TEXT,
  emergency   TEXT,
  reception   TEXT,
  description TEXT,
  facilities  TEXT,
  services    TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- BRANDING (single row) ----------
CREATE TABLE IF NOT EXISTS branding (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  primary_color   TEXT NOT NULL DEFAULT '#00D4AA',
  secondary_color TEXT NOT NULL DEFAULT '#00B894',
  logo_text       TEXT NOT NULL DEFAULT 'SC',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- DEPARTMENTS ----------
CREATE TABLE IF NOT EXISTS departments (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  head        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- DOCTORS ----------
CREATE TABLE IF NOT EXISTS doctors (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  specialization TEXT,
  department_id  TEXT REFERENCES departments(id) ON DELETE SET NULL,
  phone          TEXT,
  photo_initials TEXT,
  availability   TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available','busy','leave')),
  schedule       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- STAFF ----------
CREATE TABLE IF NOT EXISTS staff (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  role          TEXT,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  shift         TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- PATIENTS ----------
CREATE TABLE IF NOT EXISTS patients (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  age        INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- APPOINTMENTS ----------
CREATE TABLE IF NOT EXISTS appointments (
  id             TEXT PRIMARY KEY,
  patient_name   TEXT NOT NULL,
  patient_id     TEXT REFERENCES patients(id) ON DELETE SET NULL,
  doctor_id      TEXT REFERENCES doctors(id) ON DELETE SET NULL,
  department_id  TEXT REFERENCES departments(id) ON DELETE SET NULL,
  date           DATE NOT NULL,
  time           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- QUEUE ----------
CREATE TABLE IF NOT EXISTS queue (
  id            TEXT PRIMARY KEY,
  num           INTEGER NOT NULL DEFAULT 0,
  patient_name  TEXT NOT NULL,
  doctor_id     TEXT REFERENCES doctors(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','in-progress','done')),
  added_at      BIGINT NOT NULL,
  position      INTEGER NOT NULL DEFAULT 0
);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE IF NOT EXISTS notifications (
  id    TEXT PRIMARY KEY,
  text  TEXT NOT NULL,
  time  BIGINT NOT NULL
);

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_doctors_department  ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_department     ON staff(department_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date    ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status  ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor  ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_status         ON queue(status);
CREATE INDEX IF NOT EXISTS idx_notifications_time   ON notifications(time DESC);

-- ---------- Seed defaults (matches defaultData() in hospital-module.html) ----------
INSERT INTO hospital_profile (id, name, address, phone, hours, email, website, emergency, reception, description, facilities, services)
VALUES (1, 'SehatConnectAI Hospital', 'Plot 14, Shahrah-e-Faisal, Karachi', '+92 21 111 222 333',
        '8:00 AM - 10:00 PM', 'info@sehatconnectai.pk', 'sehatconnectai.pk', '+92 21 111 222 000',
        '+92 21 111 222 333', 'Premier healthcare facility providing world-class medical services.',
        'Emergency, ICU, Operation Theater, Lab, Pharmacy, Radiology',
        'Cardiology, Orthopedics, Pediatrics, Neurology, General Surgery')
ON CONFLICT (id) DO NOTHING;

INSERT INTO branding (id, primary_color, secondary_color, logo_text)
VALUES (1, '#00D4AA', '#00B894', 'SC')
ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (id, name, description, head)
SELECT * FROM (VALUES
  ('dep_cardiology',  'Cardiology',  'Heart & vascular care', 'Dr. Ayesha Khan'),
  ('dep_orthopedics', 'Orthopedics', 'Bone & joint care',     'Dr. Bilal Ahmed'),
  ('dep_pediatrics',  'Pediatrics',  'Child healthcare',      'Dr. Sana Rizvi')
) AS seed(id, name, description, head)
WHERE NOT EXISTS (SELECT 1 FROM departments);

-- Demo login users (admin/admin123, staff/staff123) are created by
-- `npm run db:init` (scripts/init-db.js) since bcrypt hashing needs Node,
-- not inline SQL.
