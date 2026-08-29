# SehatConnectAI

An intelligent healthcare platform that uses AI, voice technology, and predictive analytics to simplify appointments, reduce waiting times, and improve patient care.

## Repository Layout

- `backend/` — Node.js/Express + Prisma + PostgreSQL API. Implemented: auth, patient profile, hospitals (incl. GPS-nearby search), departments, doctors, doctor schedules, time slots, appointments, queue.
- `frontend/` — React Native + Expo Patient app. **Phase 1 complete**: all 11 patient screens implemented (see below).
- `database/` — schema/migrations/seeds reference material.
- `docs/` — project documentation (architecture, scope, contracts, etc. — see links below).

## Current Development State

Backend foundation is implemented. Frontend **Phase 1 (Functional Grey Structure) is complete**: all 23 planned tasks and 11 patient screens are implemented on `feat/patient-frontend-phase-1`, open as PR awaiting review/merge into `main`. Phase 2 (design/styling) has not started.

## Frontend Scope (Patient App)

Patient-facing frontend only, 11 screens: Login, Registration, Forgot Password, Home, Profile, Find Hospital, Hospital Details, Find Doctor, Find Department, Department Doctors, Appointments. Full detail in [docs/FRONTEND_SCOPE.md](docs/FRONTEND_SCOPE.md).

## Architecture Summary

Feature-first, hook-based MVVM on Expo Router: View (React Native UI) → ViewModel (React hook, orchestrates TanStack Query + React Hook Form/Zod) → Model (types, Zod schemas, API/adapter functions). Full detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Phases

1. **Preparation** — stack selection, skills, architecture/doc freeze, Phase 1 detailed plan. Done.
2. **Phase 1 — Functional Grey Structure** — all 11 screens working end-to-end, no visual polish. Done, PR open, not yet merged.
3. **Phase 2 — Design / Styling / Polish** (current, not started) — visual identity, accessibility pass.

Full detail in [docs/PHASES.md](docs/PHASES.md).

## Project Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/PHASES.md](docs/PHASES.md)
- [docs/FRONTEND_SCOPE.md](docs/FRONTEND_SCOPE.md)
- [docs/DATA_CONTRACTS.md](docs/DATA_CONTRACTS.md)
- [docs/DATABASE.md](docs/DATABASE.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/ERROR_HANDLING.md](docs/ERROR_HANDLING.md)
- [docs/PROMPTS.md](docs/PROMPTS.md)
- [docs/SKILL_AUDIT.md](docs/SKILL_AUDIT.md)
