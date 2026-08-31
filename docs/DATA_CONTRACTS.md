# Data Contracts — Frontend-Facing

Evidence: `backend/prisma/schema.prisma` + `backend/src/routes/*.routes.js` + `backend/src/services/auth.service.js`, read on 2026-08-29. This documents only what the Patient Frontend consumes — not the full backend schema. All responses are wrapped `{ success: boolean, data?, message?, error? }` unless noted.

All backend routes below are **real and implemented** unless marked `[ADAPTER]` — those need a temporary frontend adapter behind the same contract because no matching backend endpoint exists yet (see ARCHITECTURE.md § Data Source Boundary).

## Auth

`POST /api/auth/register/patient`
Request: `{ full_name, email?, phone?, password, preferred_language? }` (email OR phone required)
Response `data`: `{ token, user: { user_id, full_name, email, phone, role: "PATIENT", preferred_language, patient_id } }`

`POST /api/auth/login`
Request: `{ email? | phone?, password }` (backend accepts either). **Login screen UI exposes Email only** — no Phone field (latest frontend clarification).
Response `data`: `{ token, user: { user_id, full_name, email, phone, role, preferred_language } }`

`GET /api/auth/me` (auth required)
Response `data`: `{ user_id, full_name, email, phone, role, preferred_language, location, profile_picture, patient?: {...} }`

## Patient Profile

`GET /api/patients/profile` (auth, PATIENT)
Response `data`: `{ patient_id, user_id, full_name, email, phone, preferred_language, date_of_birth, gender, address, city, emergency_contact }`

`PATCH /api/patients/profile` (auth, PATIENT)
Request (all optional, partial update): `{ full_name?, phone?, preferred_language?, date_of_birth?, gender?, address?, city?, emergency_contact? }`. **`email` is not accepted** — frontend keeps Email visible but read-only for this reason; do not fake a successful email update.
Response `data`: same shape as GET.

## Hospital

`GET /api/hospitals` — all active hospitals.
`GET /api/hospitals/nearby?latitude&longitude&radius` — GPS haversine search (radius km, default 10, max 100). Adds `distance_km` per hospital.
`GET /api/hospitals/search?city` — case-insensitive city substring match.
`GET /api/hospitals/:hospital_id` — full detail incl. `working_hours[]`, `departments[]`, `doctors[]`.

Hospital shape: `{ hospital_id, name, facility_type, description, logo_url, cover_image_url, theme, phone, email, address, city, latitude, longitude, is_active, created_at, updated_at }`

## Department

`GET /api/departments/hospital/:hospitalId` — active departments for one hospital: `{ department_id, hospital_id, name, description, is_active }`

`[ADAPTER] Find Department` (cross-hospital department search/discovery) — no backend endpoint exists. Frontend Model layer defines `findDepartments(query): Department[]`, composing the real per-hospital `GET /api/departments/hospital/:hospitalId` endpoint across the discovery scope (GPS/manual). Not mock/local data — every result is a real backend record.

## Doctor

`GET /api/doctors/hospital/:hospitalId` — active doctors for a hospital.
`GET /api/doctors/department/:departmentId` — active doctors for a department.
`GET /api/doctors/:doctor_id` — full profile incl. `hospital`, `department`, `schedules[]`.

Doctor shape: `{ doctor_id, hospital_id, department_id, name, specialization, qualification, license_number, bio, consultation_fee, is_active }`. **A doctor belongs to exactly one hospital and one department — never more.**

`[ADAPTER] Find Doctor` (cross-hospital doctor search/discovery) — no backend endpoint exists. Frontend Model layer defines `findDoctors(query): DoctorDetail[]`, composing real backend endpoints (`GET /api/hospitals*` to resolve the discovery scope, `GET /api/doctors/hospital/:hospitalId` to search, `GET /api/doctors/:doctor_id` for full detail). Not mock/local data — every result is a real backend record. **Note (intentional deviation, kept as-is):** the return type is `DoctorDetail[]` (`Doctor` + `hospital`/`department`/`schedules`), not bare `Doctor[]` — Task 14's own requirement (show hospital name + available days/timings per result) needs that data. Do not "fix" the signature back to `Doctor[]`.

## Doctor Schedule / Time Slot

`GET /api/doctors/:doctor_id` includes `schedules[]`: `{ schedule_id, doctor_id, day_of_week, start_time, end_time, appointment_duration, is_active }`

`GET /api/time-slots/doctor/:doctorId/date/:date` (date = `YYYY-MM-DD`) — slots for one doctor on one date: `{ slot_id, doctor_id, hospital_id, date, start_time, end_time, status }`. `status`: `AVAILABLE | BOOKED | BLOCKED | COMPLETED`.

## Appointment

`GET /api/appointments/my` (auth, PATIENT) — patient's own appointments, newest first, includes `doctor`, `hospital`, `department`, `slot`.

`POST /api/appointments` (auth, PATIENT)
Request: `{ doctor_id, hospital_id, department_id, slot_id, reason? }`
Response `data`: created Appointment (`status: "BOOKED"`, server-generated `booking_reference`).

`GET /api/appointments/:appointment_id` (auth, PATIENT, own only)

`PATCH /api/appointments/:appointment_id/cancel` (auth, PATIENT, own only) — only valid from `BOOKED`/`CONFIRMED`; frees the time slot back to `AVAILABLE`.

Appointment shape: `{ appointment_id, patient_id, doctor_id, hospital_id, department_id, slot_id, appointment_date, appointment_time, status, booking_reference, token_number?, reason, created_at, updated_at }`
`status`: `BOOKED | CONFIRMED | CHECKED_IN | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW`

## Queue (read-only for patients; status changes are staff-driven)

`GET /api/queue/my` (auth, PATIENT) — active queue entries (`WAITING | CALLED | IN_PROGRESS`) for the patient, with nested appointment/doctor/hospital/department.

Queue shape: `{ queue_id, hospital_id, doctor_id, appointment_id, token_number, queue_status, check_in_time, estimated_wait_time, called_at, completed_at }`

## Location Search / Result (frontend-composed, not a backend entity)

Used by Find Hospital: `{ latitude: number, longitude: number, radius_km?: number }` as input to `GET /api/hospitals/nearby`; results carry the backend-computed `distance_km`. Manual city text search uses `GET /api/hospitals/search?city`.

## Enums Used by the Frontend

- `PreferredLanguage`: `ENGLISH | URDU | ROMAN_URDU`
- `FacilityType`: `HOSPITAL | CLINIC | MEDICAL_CENTER`
- `DayOfWeek`: `MONDAY..SUNDAY`
- `TimeSlotStatus`, `AppointmentStatus`, `QueueStatus`: as above.
