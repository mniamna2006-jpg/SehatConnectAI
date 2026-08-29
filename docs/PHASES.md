# Project Phases

## PREPARATION (current)

- CT scan of repository (read-only audit) — done
- Stack selection (Expo + Expo Router + TanStack Query + RHF/Zod) — done
- Skills bootstrap/audit — done (see `docs/SKILL_AUDIT.md`)
- Architecture freeze — done (see `ARCHITECTURE.md`)
- Documentation freeze — this package
- Phase 1 Detailed Implementation Plan — **not started, next step after this gate is reviewed**

## PHASE 1 — Functional Grey Structure

Scaffold Expo app, build all 11 patient screens end-to-end against real/adapter data with correct navigation, forms, and state — no visual design work. UI choices limited to: understandable layout, correct interaction, touch targets, basic accessibility, no broken overflow, safe areas, keyboard usability.

Target directory shape (feature-first MVVM, YAGNI — a feature only gets the files it needs):

```
frontend/
├── app/
│   ├── _layout.tsx
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   └── (app)/
│       ├── home.tsx
│       ├── profile.tsx
│       ├── find-hospital.tsx
│       ├── hospital/[id].tsx
│       ├── find-doctor.tsx
│       ├── find-department.tsx
│       ├── department/[id]/doctors.tsx
│       └── appointments/index.tsx
├── src/
│   ├── features/
│   │   ├── auth/          (model/ viewmodels/ views/ components/)
│   │   ├── profile/
│   │   ├── hospitals/
│   │   ├── doctors/
│   │   ├── departments/
│   │   └── appointments/
│   ├── core/               (api/ storage/ location/ query/)
│   ├── shared/              (components/ hooks/ constants/ types/)
│   ├── providers/           (AuthProvider.tsx LocaleProvider.tsx)
│   └── i18n/
└── assets/
```

## PHASE 2 — Design / Styling / Polish

Apply visual identity: `ui-ux-pro-max` + `expo-design-system` for design system generation, `frontend-design` + `craft`/`general-design-review` for polish, `accessibility` skill for a full WCAG pass. Not started until Phase 1 grey structure is functionally complete and reviewed.
