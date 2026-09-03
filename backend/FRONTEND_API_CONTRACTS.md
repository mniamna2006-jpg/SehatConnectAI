# Frontend API Contract Freeze

All JSON responses use `{ success, data?, message? }`. Authenticated routes require `Authorization: Bearer <JWT>`. Public read routes return active records unless stated otherwise. This matrix reflects registered backend routes as of 2026-09-03.

## Authentication

| Method | Route | Access | Request / stable data |
|---|---|---|---|
| POST | `/api/auth/register/patient` | Public | `{ full_name, email? or phone?, password, preferred_language? }`; returns `{ token, user }` |
| POST | `/api/auth/login` | Public; PATIENT account only | `{ email? or phone?, password }`; returns `{ token, user }` |
| POST | `/api/auth/login-hospital` | Public; ADMIN or STAFF account only | `{ email? or phone?, password }`; returns `{ token, user: { ..., hospital, department? } }` |
| GET | `/api/auth/me` | Authenticated | Current user, role, and role-specific profile context |

## Patient application

| Method | Route | Access | Stable data / behavior |
|---|---|---|---|
| GET, PATCH | `/api/patients/profile` | PATIENT; own profile | Patient and user profile fields |
| GET | `/api/hospitals` | Public | Active hospitals |
| GET | `/api/hospitals/nearby?latitude=&longitude=&radius=` | Public | Active hospitals plus `distance_km` |
| GET | `/api/hospitals/search?city=` | Public | Active hospitals matching city |
| GET | `/api/hospitals/:hospital_id` | Public | Hospital with working hours, active departments, active doctors |
| GET | `/api/departments/hospital/:hospitalId` | Public | Active hospital departments |
| GET | `/api/doctors/hospital/:hospitalId` | Public | Active doctors, including persisted `is_available` |
| GET | `/api/doctors/department/:departmentId` | Public | Active doctors, including persisted `is_available` |
| GET | `/api/doctors/:doctor_id` | Public | Active doctor with hospital, department, schedules, and `is_available` |
| GET | `/api/time-slots/doctor/:doctorId/date/:date` | Public | Doctor slots for `YYYY-MM-DD` |
| POST | `/api/appointments` | PATIENT | Books own patient against matching active hospital, department, doctor, and available slot |
| GET | `/api/appointments/my` | PATIENT; own records | Appointments with doctor, hospital, department, slot |
| GET | `/api/appointments/:appointment_id` | PATIENT; own record | Appointment detail |
| PATCH | `/api/appointments/:appointment_id/cancel` | PATIENT; own record | Cancels BOOKED/CONFIRMED appointment |
| GET | `/api/queue/my` | PATIENT; own records | Active WAITING/CALLED/IN_PROGRESS queue entries |
| GET | `/api/notifications/my` | Authenticated; own records | Notifications newest first |
| GET | `/api/notifications/unread-count` | Authenticated; own records | `{ count }` |
| PATCH | `/api/notifications/:notification_id/read` | Authenticated; own record | Mark one read |
| PATCH | `/api/notifications/read-all` | Authenticated; own records | `{ updated_count }` |
| POST | `/api/ai/chat` | PATIENT; rate limited | `{ message, language?, conversation_id? }`; returns AI message, emergency flag, structured department/doctors snapshot |
| GET | `/api/ai/history` | PATIENT; own records | Conversation summaries |
| GET | `/api/ai/history/:conversationId` | PATIENT; own record | Messages with persisted recommendation snapshots |
| DELETE | `/api/ai/history/:conversationId` | PATIENT; own record | Deletes conversation and messages |
| GET | `/api/doctors/:doctor_id/availability-subscription` | PATIENT; own subscription | `{ doctor_id, subscribed, is_available }` |
| POST | `/api/doctors/:doctor_id/availability-subscription` | PATIENT; own subscription | Idempotently subscribes to future availability alerts |
| DELETE | `/api/doctors/:doctor_id/availability-subscription` | PATIENT; own subscription | Idempotently unsubscribes |

## Hospital administration

| Method | Route | Access | Stable data / behavior |
|---|---|---|---|
| GET | `/api/admin/dashboard` | ADMIN; own hospital | Hospital-scoped department, doctor, staff, patient, appointment, queue totals |
| PATCH | `/api/hospitals/:hospital_id` | ADMIN; own hospital | Hospital profile update |
| POST | `/api/departments` | ADMIN; own hospital | Create department |
| PATCH | `/api/departments/:department_id` | ADMIN; owning hospital | Update department |
| PATCH | `/api/departments/:department_id/deactivate` | ADMIN; owning hospital | Deactivate department |
| POST | `/api/doctors` | ADMIN; own hospital | Create doctor |
| PATCH | `/api/doctors/:doctor_id` | ADMIN; owning hospital | Update doctor |
| PATCH | `/api/doctors/:doctor_id/deactivate` | ADMIN; owning hospital | Deactivate doctor and clear temporary availability |
| PATCH | `/api/doctors/:doctor_id/availability` | ADMIN; owning hospital | `{ is_available: boolean }`; returns doctor plus `notifications_created` |
| GET | `/api/schedules/doctor/:doctorId` | Public | Active recurring doctor schedule |
| POST | `/api/schedules` | ADMIN; doctor-owning hospital | Create recurring schedule |
| POST | `/api/time-slots/generate` | ADMIN; doctor-owning hospital | `{ doctor_id, hospital_id, date }`; generate slots |
| GET | `/api/staff/hospital/:hospitalId` | ADMIN; own hospital | Staff list |
| POST | `/api/staff` | ADMIN; own hospital | Create staff |
| PATCH | `/api/staff/:staff_id` | ADMIN; owning hospital | Update staff |
| PATCH | `/api/staff/:staff_id/deactivate` | ADMIN; owning hospital | Deactivate staff and user |
| GET | `/api/staff/invitations/hospital/:hospitalId` | ADMIN; own hospital | Invitation list |
| POST | `/api/staff/invitations` | ADMIN; own hospital | Create invitation |
| PATCH | `/api/staff/invitations/:invitation_id/revoke` | ADMIN; owning hospital | Revoke invitation |
| GET | `/api/analytics/overview` | ADMIN or STAFF; own hospital | Hospital-scoped appointments, patients, queue, and operations |

Public invitation acceptance remains `GET /api/staff/invitations/token/:token` and `POST /api/staff/invitations/accept`.

## Hospital staff

| Method | Route | Access | Stable data / behavior |
|---|---|---|---|
| GET | `/api/staff/dashboard` | STAFF or ADMIN with active HospitalStaff profile/hospital | Own-hospital daily dashboard |
| GET | `/api/staff/appointments/today` | STAFF or ADMIN with active HospitalStaff profile/hospital | Own-hospital appointments for current Pakistan date |
| GET | `/api/appointments/hospital` | STAFF with active profile | Own-hospital appointments |
| PATCH | `/api/appointments/:appointment_id/status` | STAFF; owning hospital | Valid status transition; CHECKED_IN creates queue |
| GET | `/api/queue/hospital` | STAFF with active profile | Active own-hospital queue |
| PATCH | `/api/queue/:queue_id/status` | STAFF; owning hospital | WAITING to CALLED to IN_PROGRESS to COMPLETED |

## Notification producers

Existing notification APIs return all in-app types without type-specific endpoints: `BOOKING_CONFIRMATION`, `CANCELLATION`, `QUEUE_UPDATE`, `APPOINTMENT_REMINDER`, and `DOCTOR_AVAILABILITY`.

No `/api/hospitals/:hospitalId/location` route exists. Use hospital `latitude`, `longitude`, `address`, and `city` fields from hospital responses.
