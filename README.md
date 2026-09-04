# SehatConnectAI

An intelligent healthcare platform that uses AI, voice technology, and predictive analytics to simplify appointments, reduce waiting times, and improve patient care.

## Repository Layout

- `backend/` — Node.js/Express + Prisma + PostgreSQL API. Implemented: auth, patient profile, hospitals (incl. GPS-nearby search), departments, doctors, doctor schedules, time slots, appointments, queue, notifications, AI chat/history. Also exposes admin/staff routes consumed by a separate (not in this repo's current frontend) admin/staff client — see `backend/FRONTEND_API_CONTRACTS.md`.
- `frontend/` — React Native + Expo **Patient app only**. All patient screens (auth, home, profile, hospital/doctor/department discovery, appointments, queue, notifications, AI chat) are implemented and styled. See below.
- `database/` — schema/migrations/seeds reference material.
- `docs/` — project documentation (architecture, scope, contracts, etc. — see links below).

## Current Development State

Backend is implemented, including patient, admin, and staff routes. The frontend in this repository is **patient-only by deliberate scope decision** (an earlier admin/staff frontend was built and then removed to keep this app patient-scoped — see `fix(frontend): make mobile app patient-only`). Patient frontend functionality and visual design are both complete on `feat/frontend-100-premium`, open as PR #16 awaiting review/merge into `main`.

## Frontend Scope (Patient App)

Patient-facing frontend only. Full detail in [docs/FRONTEND_SCOPE.md](docs/FRONTEND_SCOPE.md).

## Architecture Summary

Feature-first, hook-based MVVM on Expo Router: View (React Native UI) → ViewModel (React hook, orchestrates TanStack Query + React Hook Form/Zod) → Model (types, Zod schemas, API/adapter functions). Full detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Getting Started

Backend: see `backend/` for its own setup (Node.js/Express + Prisma + PostgreSQL).

Frontend:
```
cd frontend
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_BASE_URL to your running backend
npm start
```
Tests: `npm test` (Jest + React Native Testing Library). Typecheck: `npm run typecheck`.

## Phases

1. **Preparation** — stack selection, skills, architecture/doc freeze. Done.
2. **Phase 1 — Functional Grey Structure** — all patient screens working end-to-end. Done.
3. **Phase 2 — Design / Styling / Polish** — visual identity, responsive/RTL fixes, accessibility pass. Done on `feat/frontend-100-premium` (PR #16).

Full detail in [docs/PHASES.md](docs/PHASES.md).

## Project Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/PHASES.md](docs/PHASES.md)
- [docs/FRONTEND_SCOPE.md](docs/FRONTEND_SCOPE.md)
- [docs/DATA_CONTRACTS.md](docs/DATA_CONTRACTS.md)
- [backend/FRONTEND_API_CONTRACTS.md](backend/FRONTEND_API_CONTRACTS.md) — authoritative, current API contract (patient + admin/staff routes)
- [docs/DATABASE.md](docs/DATABASE.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/ERROR_HANDLING.md](docs/ERROR_HANDLING.md)
- [docs/PROMPTS.md](docs/PROMPTS.md)
- [docs/SKILL_AUDIT.md](docs/SKILL_AUDIT.md)
