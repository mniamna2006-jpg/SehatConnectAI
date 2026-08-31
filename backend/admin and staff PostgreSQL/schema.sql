-- =========================================================
-- Hospital Module — PostgreSQL schema (used by server.js)
-- Run this once before starting the backend:
--   pgAdmin: Query Tool > open schema.sql > Execute (F5)
--   or:  psql -U postgres -f schema.sql
-- =========================================================

-- Run this first, then connect to the new database before the rest:
--   psql: \c hospital_module
CREATE DATABASE hospital_module;

-- ---- run everything below while connected to hospital_module ----

CREATE TYPE user_role AS ENUM ('admin','staff');
CREATE TYPE doctor_availability AS ENUM ('available','busy','leave');
CREATE TYPE appt_status AS ENUM ('pending','confirmed','completed','cancelled');
CREATE TYPE queue_status AS ENUM ('waiting','in-progress','done');

CREATE TABLE hospital_profile (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(150),
  address VARCHAR(255),
  phone VARCHAR(30),
  email VARCHAR(120),
  opening_time VARCHAR(5),  -- 24h "HH:MM", formatted to 12-hour on display
  closing_time VARCHAR(5)   -- 24h "HH:MM", formatted to 12-hour on display
);

CREATE TABLE branding (
  id VARCHAR(20) PRIMARY KEY,
  primary_color VARCHAR(10),
  secondary_color VARCHAR(10),
  logo_text VARCHAR(5)
);

-- Login accounts (separate from the operational data above)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,   -- plain text for local/demo use only — hash in production
  role user_role NOT NULL
);

CREATE TABLE departments (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  head VARCHAR(100)
);

CREATE TABLE doctors (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  department_id VARCHAR(20) REFERENCES departments(id) ON DELETE SET NULL,
  phone VARCHAR(30),
  photo_initials VARCHAR(5),
  availability doctor_availability DEFAULT 'available',
  schedule JSONB DEFAULT '{}'::jsonb,  -- per-day {start,end} 24h times, formatted to 12-hour on display
  slots JSONB DEFAULT '[]'::jsonb      -- bookable time slots: [{id,start,end,status}], 24h times
);

CREATE TABLE staff (
  id VARCHAR(20) PRIMARY KEY,
  employee_id VARCHAR(30),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(80),
  department_id VARCHAR(20) REFERENCES departments(id) ON DELETE SET NULL,
  shift VARCHAR(80),
  phone VARCHAR(30),
  email VARCHAR(120),
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE patients (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  age INT
);

CREATE TABLE appointments (
  id VARCHAR(20) PRIMARY KEY,
  patient_name VARCHAR(100) NOT NULL,
  doctor_id VARCHAR(20) REFERENCES doctors(id) ON DELETE SET NULL,
  department_id VARCHAR(20) REFERENCES departments(id) ON DELETE SET NULL,
  appt_date DATE NOT NULL,
  appt_time VARCHAR(20),
  status appt_status DEFAULT 'pending'
);

CREATE TABLE queue (
  id VARCHAR(20) PRIMARY KEY,
  queue_num INT,
  patient_name VARCHAR(100) NOT NULL,
  doctor_id VARCHAR(20) REFERENCES doctors(id) ON DELETE SET NULL,
  status queue_status DEFAULT 'waiting',
  added_at BIGINT,
  appt_time VARCHAR(5)  -- 24h "HH:MM" from the booked time slot, formatted to 12-hour on display
);

CREATE TABLE notifications (
  id VARCHAR(20) PRIMARY KEY,
  text VARCHAR(255) NOT NULL,
  created_at BIGINT
);

-- =========================================================
-- SEED DATA
-- =========================================================

INSERT INTO hospital_profile (id, name, address, phone, email, opening_time, closing_time) VALUES
('profile', 'SehatConnectAI Hospital', 'Plot 14, Shahrah-e-Faisal, Karachi', '+92 21 111 222 333', 'info@sehatconnect.pk', '08:00', '22:00');

INSERT INTO branding (id, primary_color, secondary_color, logo_text) VALUES
('branding', '#0E6F5C', '#16324F', 'SC');

INSERT INTO users (username, password, role) VALUES
('admin', 'admin123', 'admin'),
('staff', 'staff123', 'staff');

INSERT INTO departments (id, name, description, head) VALUES
('dep_cardio', 'Cardiology', 'Heart & vascular care', 'Dr. Ayesha Khan'),
('dep_ortho', 'Orthopedics', 'Bone & joint care', 'Dr. Bilal Ahmed'),
('dep_pedia', 'Pediatrics', 'Child healthcare', 'Dr. Sana Rizvi');

INSERT INTO doctors (id, name, specialization, department_id, phone, photo_initials, availability, slots) VALUES
('doc_ayesha', 'Dr. Ayesha Khan', 'Cardiologist', 'dep_cardio', '0300-1112233', 'AK', 'available', '[{"id":"slot_1","start":"09:00","end":"09:30","status":"available"},{"id":"slot_2","start":"09:30","end":"10:00","status":"booked"}]'),
('doc_bilal', 'Dr. Bilal Ahmed', 'Orthopedic Surgeon', 'dep_ortho', '0300-2223344', 'BA', 'busy', '[]'),
('doc_sana', 'Dr. Sana Rizvi', 'Pediatrician', 'dep_pedia', '0300-3334455', 'SR', 'leave', '[]');

INSERT INTO staff (id, employee_id, name, role, department_id, shift, phone, email, active) VALUES
('stf_mubashir', 'EMP-1001', 'Mubashir Javaid', 'Front Desk Coordinator', 'dep_cardio', 'Morning (8am-4pm)', '0301-9998877', 'mubashir@sehatconnect.pk', TRUE),
('stf_hina', 'EMP-1002', 'Hina Malik', 'Nurse', 'dep_ortho', 'Evening (4pm-12am)', '0301-8887766', 'hina@sehatconnect.pk', TRUE);

INSERT INTO patients (id, name, phone, age) VALUES
('pat_ahmed', 'Ahmed Raza', '0333-1234567', 34),
('pat_fatima', 'Fatima Noor', '0333-7654321', 27);

INSERT INTO appointments (id, patient_name, doctor_id, department_id, appt_date, appt_time, status) VALUES
('apt_1', 'Ahmed Raza', 'doc_ayesha', 'dep_cardio', CURRENT_DATE, '10:30 AM', 'confirmed'),
('apt_2', 'Fatima Noor', 'doc_sana', 'dep_pedia', CURRENT_DATE, '12:00 PM', 'pending');
