# Frontend Security Rules

- Auth token (JWT from `/api/auth/*`) lives in **Expo SecureStore** only. Never AsyncStorage, never plain React state persisted to disk.
- No backend secret (JWT signing secret, DB credentials, etc.) is ever embedded in the app. Expo public env values (`EXPO_PUBLIC_*`) are public — treat anything prefixed that way as visible to anyone who inspects the built app.
- Client-side validation (Zod/React Hook Form) is a UX convenience, never a substitute for server-side validation — the backend re-validates everything.
- GPS/location permission is requested only on explicit user action (e.g. tapping "Use my location" on Find Hospital) — never on app launch or silently.
- No sensitive logging: never log full JWTs, passwords, or full patient PII (name+DOB+contact together) to console in production builds.
- Error messages shown to the user are safe/generic; raw backend error strings/stack traces are not surfaced verbatim to the UI (log them for debugging, show a friendly message — see ERROR_HANDLING.md).
- Logout clears the SecureStore token AND clears the TanStack Query cache (no stale patient data survives a logout in memory).
- Dependency/skill supply-chain caution: only install skills/packages from verified sources after inspection (see `docs/SKILL_AUDIT.md`); never blindly run installer one-liners from search results.
