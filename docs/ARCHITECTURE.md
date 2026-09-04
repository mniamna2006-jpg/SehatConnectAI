# Frontend Architecture — Patient App

Status: **Implemented** — Phase 1 (functional) and Phase 2 (design/polish) are both done on `feat/frontend-100-premium`.

## Stack

React Native + Expo (Expo Router), TypeScript. See [FRONTEND_SCOPE.md](./FRONTEND_SCOPE.md) for what's in scope.

## Pattern: Feature-First, Hook-Based MVVM

Pragmatic MVVM — not class-heavy Android-style MVVM. Three layers per feature:

```
VIEW            React Native UI, Expo Router route entry, feature View component
                 ↓ calls
VIEWMODEL       React hook (useXxxViewModel) — query/mutation orchestration,
                 form orchestration, navigation handlers, derived UI state
                 ↓ calls
MODEL           TS domain types, Zod schemas, DTO mapping, API functions,
                 real/mock adapters, backend contracts
```

```
┌──────────┐   props/handlers   ┌───────────────┐   calls   ┌────────────────┐
│  View    │ ─────────────────► │  ViewModel     │ ────────► │  Model          │
│ (JSX)    │ ◄───────────────── │  (hook)        │ ◄──────── │ (types/api/zod) │
└──────────┘   UI state/data     └───────────────┘  data/err └────────────────┘
```

**Dependency direction is one-way: View → ViewModel → Model.** Model never imports React or JSX. ViewModel never renders JSX.

### Rules (prohibited shortcuts)

- Views must NOT fetch APIs, read SecureStore, own backend mapping, or contain business logic.
- ViewModels must NOT render JSX or become giant global state stores.
- Models must NOT depend on React/UI.
- No `if (mockMode)` branching inside Views — the swap between real and mock data happens inside the Model layer only (see Data Source Boundary below).

## Route Layer — Expo Router

`app/` holds only route entries (thin wrappers that render a feature's View). Route groups: `(auth)` for unauthenticated screens, `(app)` for authenticated screens. Dynamic segments (`[id].tsx`) map to detail screens (hospital, department doctors).

## State Ownership

| Concern | Owner |
|---|---|
| Server state (API data, caching, refetch) | TanStack Query |
| Form state | React Hook Form |
| Validation | Zod |
| Auth token | Expo SecureStore |
| Current user | TanStack Query + AuthProvider orchestration |
| Locale | LocaleProvider |
| Navigation | Expo Router |
| Transient screen UI state (toggles, tab index) | Local React state inside the ViewModel hook |

No Redux, no Zustand, unless Phase 1 surfaces a concrete cross-cutting state need existing ownership can't cleanly handle.

## Data Source Boundary

Backend already exists and is read-only from the frontend's perspective (see [DATABASE.md](./DATABASE.md)). Real endpoints exist for auth, patient profile, hospitals (including GPS-based `/nearby`), departments, doctors, time slots, appointments, and queue status.

For backend functionality the frontend needs but that doesn't exist yet (e.g. combined doctor/department discovery across hospitals), the Model layer defines a temporary adapter behind the **same contract** the real API would expose:

```
ViewModel → model/xxx.ts (function signature) → real adapter (calls backend)
                                                → OR temporary mock adapter (same return shape)
```

Swapping mock → real later means replacing the adapter implementation only; nothing above the Model layer changes. The backend itself is never modified for this project.

## Providers

`AuthProvider` (token + current-user session) and `LocaleProvider` (English / Urdu / Roman Urdu) wrap the app root. Providers own cross-cutting concerns that multiple features need; they are not a place for feature-specific state.

## Directory Shape

See PHASES.md for the target tree. A feature only gets the files it needs (`model.ts` + `useViewModel.ts` + `View.tsx` is sufficient when that's all a feature requires) — no empty enterprise boilerplate.
