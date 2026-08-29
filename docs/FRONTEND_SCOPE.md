# Frontend Scope — FROZEN

## In Scope: Patient Frontend Only

This is the **only** frontend being built right now. Hospital admin/staff web frontend, if it exists elsewhere, is out of scope and not referenced by this documentation package.

## 11 Screens (frozen count — do not add/merge/split without explicit re-authorization)

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
11. Appointments (single hub screen — list of the patient's own appointments; no `[id]` route required, optional query params to prefill/highlight one entry)

## Include

- Patient registration/login/forgot-password against real backend auth (`/api/auth/*`).
- Home as a navigation hub to the other patient features.
- Profile view/edit against real backend (`/api/patients/profile`). Email is displayed but read-only — backend PATCH does not accept email mutation.
- Hospital discovery: list, GPS-nearby, city search, and detail view — all against real backend (`/api/hospitals/*`).
- Doctor discovery scoped by hospital or by department (real backend), plus a combined "Find Doctor" cross-hospital search (adapter — see DATA_CONTRACTS.md, no matching backend endpoint yet).
- Department discovery scoped by hospital (real backend) and a combined cross-hospital "Find Department" search (adapter, same reason).
- Appointment booking, cancellation, and viewing the patient's own appointment list (real backend).
- Language preference: English, Urdu, Roman Urdu only.
- Doctor belongs to exactly ONE hospital and ONE department (matches backend schema — no multi-hospital doctor sittings).

## Exclude (explicitly, to prevent scope drift)

- Hospital Admin/Staff frontend and any staff-only flows (staff check-in, queue management screens, doctor/department creation forms).
- Any AI assistant / chatbot UI (see `PROMPTS.md` — no production AI feature exists in this scope).
- Any language beyond English/Urdu/Roman Urdu.
- Any appointment detail requiring a mandatory appointment ID route param — Appointments is a single hub, not a per-ID detail screen.
- Location capture inside Registration or Profile — location/GPS use is confined to discovery flows (Find Hospital, Find Doctor, Find Department), triggered by explicit user action, never bundled into registration or profile.
- Design system generation, visual polish, animation — Phase 2 only.
- Any backend modification.
