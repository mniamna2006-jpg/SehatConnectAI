# SehatConnectAI

An intelligent healthcare platform that uses AI, voice technology, and predictive analytics to simplify appointments, reduce waiting times, and improve patient care.

## Repository Layout

- `backend/` — Node.js/Express + Prisma + PostgreSQL API. Implemented: auth, patient profile, hospitals (incl. GPS-nearby search), departments, doctors, doctor schedules, time slots, appointments, queue.
- `frontend/` — React Native + Expo Patient app. **Not yet scaffolded** (directory currently holds only placeholder folders); see below.
- `database/` — schema/migrations/seeds reference material.
- `docs/` — project documentation (architecture, scope, contracts, etc. — see links below).

## Current Development State

Backend foundation is implemented. Frontend is in **pre-Phase-1 preparation**: architecture is frozen and documented, but no Expo project has been scaffolded and no screens exist yet.

## Frontend Scope (Patient App)

Patient-facing frontend only, 11 screens: Login, Registration, Forgot Password, Home, Profile, Find Hospital, Hospital Details, Find Doctor, Find Department, Department Doctors, Appointments. Full detail in [docs/FRONTEND_SCOPE.md](docs/FRONTEND_SCOPE.md).

## Architecture Summary

Feature-first, hook-based MVVM on Expo Router: View (React Native UI) → ViewModel (React hook, orchestrates TanStack Query + React Hook Form/Zod) → Model (types, Zod schemas, API/adapter functions). Full detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Phases

1. **Preparation** (current) — stack selection, skills, architecture/doc freeze, Phase 1 detailed plan.
2. **Phase 1 — Functional Grey Structure** — all 11 screens working end-to-end, no visual polish.
3. **Phase 2 — Design / Styling / Polish** — visual identity, accessibility pass.

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
