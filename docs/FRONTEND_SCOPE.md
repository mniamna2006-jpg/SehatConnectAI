# Frontend Scope

## In Scope: Patient Frontend Only

This is the **only** frontend built in this repository. A hospital admin/staff frontend was built once (`feat/admin-staff-frontend`) and deliberately removed (`fix(frontend): make mobile app patient-only`) to keep this app patient-scoped. Any admin/staff client lives outside this repository's current frontend; the backend routes it would use are documented in `backend/FRONTEND_API_CONTRACTS.md` for reference only.

## Screens

1. Login
2. Registration
3. Forgot Password
4. Home
5. Profile
6. Find Hospital
7. Hospital Details
8. Find Doctor
9. Find Department
10. Department Doctors
11. Appointments (list of the patient's own appointments, plus booking and cancellation)
12. Queue (the patient's own live queue position, read-only)
13. Notifications (booking confirmation, cancellation, queue updates, reminders, doctor-availability alerts)
14. AI Chat (symptom-triage assistant against `/api/ai/chat`)
15. AI History (past AI conversations, view/delete)

Adding/removing screens beyond this list still requires explicit re-authorization.

## Include

- Patient registration/login/forgot-password against real backend auth (`/api/auth/*`).
- Home as a navigation hub to the other patient features.
- Profile view/edit against real backend (`/api/patients/profile`). Email is displayed but read-only — backend PATCH does not accept email mutation.
- Hospital discovery: list, GPS-nearby, city search, and detail view — all against real backend (`/api/hospitals/*`).
- Doctor discovery scoped by hospital or by department (real backend), plus a combined "Find Doctor" cross-hospital search (adapter — see DATA_CONTRACTS.md, no matching backend endpoint yet), plus doctor-availability subscribe/unsubscribe alerts.
- Department discovery scoped by hospital (real backend) and a combined cross-hospital "Find Department" search (adapter, same reason).
- Appointment booking, cancellation, and viewing the patient's own appointment list (real backend).
- Queue: the patient's own active queue entry, read-only (status changes are staff-driven).
- Notifications: list, unread count, mark read/mark all read.
- AI Chat and AI History against real backend (`/api/ai/*`).
- Language preference: English, Urdu, Roman Urdu only.
- Doctor belongs to exactly ONE hospital and ONE department (matches backend schema — no multi-hospital doctor sittings).

## Exclude (explicitly, to prevent scope drift)

- Hospital Admin/Staff frontend and any staff-only flows (staff check-in, queue management screens, doctor/department creation forms) — deliberately removed from this repo's frontend, see above.
- Any language beyond English/Urdu/Roman Urdu.
- Any appointment detail requiring a mandatory appointment ID route param — Appointments is a single hub, not a per-ID detail screen.
- Location capture inside Registration or Profile — location/GPS use is confined to discovery flows (Find Hospital, Find Doctor, Find Department), triggered by explicit user action, never bundled into registration or profile.
- Any backend modification.
