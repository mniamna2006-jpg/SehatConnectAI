# SehatConnectAI — Project Rules

Full context lives in `docs/` — read there, don't duplicate here:
[ARCHITECTURE.md](docs/ARCHITECTURE.md) · [PHASES.md](docs/PHASES.md) · [FRONTEND_SCOPE.md](docs/FRONTEND_SCOPE.md) · [DATA_CONTRACTS.md](docs/DATA_CONTRACTS.md) · [SECURITY.md](docs/SECURITY.md) · [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) · [SKILL_AUDIT.md](docs/SKILL_AUDIT.md)

## Permanent Rules

- **Patient frontend only**, unless the user explicitly expands scope. See FRONTEND_SCOPE.md for the current screen list.
- **Backend is read-only** for current frontend work. Never modify `backend/`; consume it via DATA_CONTRACTS.md.
- **Architecture: feature-first, hook-based MVVM** (View → ViewModel hook → Model), Expo Router for navigation. Not class-heavy MVVM. No Redux/Zustand unless a concrete Phase 1 need proves existing state ownership (TanStack Query / RHF+Zod / SecureStore / providers) can't handle it.
- **YAGNI on structure** — a feature gets only the files it needs (`model.ts` + `useViewModel.ts` + `View.tsx` is enough when that's sufficient). No empty enterprise boilerplate.
- **Skill routing by task, not by default** — pick the smallest useful skill set per task (primary + at most 1-2 supporting), don't load the whole library. See SKILL_AUDIT.md routing table for the token-saving trio (Caveman / save-tokens / token-saver) — never stack all three.
- **Progressive disclosure** — inspect skill/doc metadata before reading full content; read full SKILL.md/docs only when actually needed.
- **Token-efficient searches** — targeted rg/grep, line-range reads, `git diff --stat` before full diff, narrow web searches. Avoid whole-file rereads and dumping lockfiles/node_modules.
- **Task-boundary compaction** — verify a task, retain decisions/files-changed/interfaces/test-results/blockers, discard exploratory dead ends, then compact before starting the next independent task. Never compact mid-edit, pre-verification, or mid-debug.
- **Run relevant tests** after implementation work (react-native-testing / RNTL once Phase 1 code exists).
- **Use Superpowers workflows** where they apply (brainstorming before creative work, systematic-debugging before bug fixes, TDD for ViewModel/Model logic).
- **Time-sensitive framework facts** (Expo SDK version, RN version, library APIs) — check current official docs/skills, don't rely on training-data memory.
- **Never silently expand scope** — new screens, new state libraries, backend changes, or AI-feature work all require explicit user authorization first.
- **No Graphify graph yet** — build one once meaningful Phase 1 code exists, not for an empty scaffold.
