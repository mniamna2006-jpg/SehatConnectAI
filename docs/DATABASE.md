# Database — Frontend Reference Only

**BACKEND OWNS THE DATABASE.** The frontend does not implement PostgreSQL or Prisma, does not run migrations, and never connects to the database directly. This file summarizes backend entities relevant to the Patient Frontend so frontend types/adapters stay accurate — the backend's `backend/prisma/schema.prisma` is the source of truth, not this file.

## Relevant Entities (patient-facing subset)

- **User** — role (`PATIENT` / `ADMIN` / `STAFF`), auth fields, `preferred_language` (`ENGLISH` / `URDU` / `ROMAN_URDU`).
- **Patient** — 1:1 with User (`PATIENT` role), extra profile fields (DOB, gender, address, city, emergency contact).
- **Hospital** — name, facility type, address/city, `latitude`/`longitude` (used for GPS-nearby search).
- **Department** — belongs to exactly one Hospital.
- **Doctor** — belongs to exactly one Hospital AND exactly one Department (never multiple).
- **DoctorSchedule** — recurring weekly availability per doctor (day, start/end time, appointment duration) — used to generate TimeSlots.
- **TimeSlot** — a specific bookable date+time for one doctor at one hospital, with status (`AVAILABLE` / `BOOKED` / `BLOCKED` / `COMPLETED`).
- **Appointment** — links Patient + Doctor + Hospital + Department + TimeSlot, with status lifecycle and a unique `booking_reference`.
- **Queue** — created automatically when an appointment is checked in; token number + queue status. Read-only for patients (staff-driven updates).
- **Notification** — user-facing notifications (booking confirmation, queue updates, reminders, doctor-availability alerts); surfaced in the frontend's Notifications screen.

## Relationships That Matter to the Frontend

- Hospital 1—N Department, Hospital 1—N Doctor.
- Department 1—N Doctor (a doctor's department must belong to the same hospital as the doctor).
- Doctor 1—N TimeSlot, TimeSlot 1—1 Appointment (once booked).
- Patient 1—N Appointment.

The frontend never writes to entities outside what a listed patient-facing endpoint allows (see [DATA_CONTRACTS.md](./DATA_CONTRACTS.md)).
