# Skill Audit — Pre-Phase-1

Snapshot as of 2026-08-29. Global install unless noted (`~/.claude/skills/` or plugin). No project-scoped `.claude/` or `.agents/` directory exists yet.

## A. Process / Engineering

| Skill | Source | Scope | Enabled | Role | Phase | Notes |
|---|---|---|---|---|---|---|
| superpowers (brainstorming, systematic-debugging, TDD, writing-plans, etc.) | claude-plugins-official | plugin, user | Yes | Process skills — invoke before creative/debug work | All | Primary process skill per this project's routing rules |
| claude-mem (mem-search, learn-codebase, make-plan, etc.) | thedotmack | plugin, user | Yes | Session memory/recall | All | Has prior CT-scan observations for this repo |

## B. Expo / React Native

| Skill | Source | Scope | Enabled | Role | Phase | Notes |
|---|---|---|---|---|---|---|
| expo-project-structure, expo-router, expo-data-fetching, expo-design-system, expo-native-ui, expo-ui, expo-examples, expo-upgrade (+16 more) | expo official plugin v1.12.0 | plugin, user | Yes | Expo/RN implementation guidance | 1 (structure/router/data-fetching), 2 (design-system) | Confirmed discoverable in this session — no restart needed |
| vercel-react-native-skills | vercel-labs/agent-skills | skill, user | Yes | React Native implementation patterns | 1 | Installed via `npx skills add` |
| react-native-testing | callstack/react-native-testing-library | skill, user | Yes | RNTL v13/v14 test patterns | 1 | Auto-detects installed RNTL version |

## C. Testing

| Skill | Source | Scope | Enabled | Role | Phase | Notes |
|---|---|---|---|---|---|---|
| react-native-testing | Callstack | skill, user | Yes | Component tests | 1 | See B above |
| superpowers:test-driven-development | plugin | user | Yes | TDD workflow | 1 | Use for ViewModel/Model unit tests |

## D. UI / UX

| Skill | Source | Scope | Enabled | Role | Phase | Notes |
|---|---|---|---|---|---|---|
| ui-ux-pro-max (+ banner-design, brand, design-system, slides, ui-styling bundled) | ui-ux-pro-max-cli v2.15.0 (nextlevelbuilder) | skill, user | Yes | Design system generation, UI reasoning rules | 2 only | Installed this session via `npm install -g --prefix ~/.npm-global` + `uipro init --ai claude --global` (global npm prefix was root-owned; used a user-writable prefix instead, no sudo). Do NOT invoke design-system generation until Phase 2. |
| awesome-ux-skills (23 skills: accessibility, craft, cognitive-load-conversion, dieter-rams-principles, ux-heuristics-review, journey-mapping, ux-personas, etc.) | tommyjepsen/awesome-ux-skills | skill, user | Yes | UX critique/process frameworks | 2 (mostly); `accessibility` usable in Phase 1 for basics | Installed previous session |
| frontend-design | claude-plugins-official | plugin, user | Yes | Visual polish | 2 | Enabled previous session |

## E. Performance

None dedicated. `superpowers` and Expo skills cover incidental performance guidance; no standalone performance skill installed. Not a Phase 1 blocker.

## F. Token / Context Optimization

| Skill | Source | Scope | Enabled | Role | Notes |
|---|---|---|---|---|---|
| caveman, caveman-commit, caveman-compress, caveman-help, caveman-review, caveman-stats, cavecrew | JuliusBrussee/caveman (skill-only install, `npx skills add`) | skill, user | Yes | Compressed agent narration | Already installed and current — not reinstalled per instruction. |
| token-saver | crichalchemist/token-saver-skill | skill, user | Yes (skill only) | Delegates routine work to free models via OpenCode MCP | **Installed this session.** Delegation runtime unavailable — see below. |
| save-tokens | chanakya-net/Maestro-AI (single skill copied, not the full plugin) | skill, user | Yes | Ultra-compressed narration | **Installed this session**, lowest-blast-radius: only `skills/save-tokens/SKILL.md` was copied — the full Maestro orchestration plugin (`run-with-it`, `break-req`, etc.) was deliberately NOT installed. |

**Delegation runtime status:** OpenCode MCP is **not configured** (`claude mcp list` has no OpenCode entry). Per instructions, no credentials/accounts were added silently.
```
TOKEN-SAVER SKILL: INSTALLED
DELEGATION RUNTIME: UNAVAILABLE — OpenCode MCP not configured
```
token-saver cannot actually delegate until a human configures OpenCode MCP. Until then, routine work stays with Claude directly (or `save-tokens`/`caveman` for narration compression only).

**Routing (do not run all three for one task):**
- Simple explanation/report → Caveman OR save-tokens
- Routine mechanical implementation → token-saver, only once OpenCode MCP exists
- Architecture/debug/security → Claude directly, never delegated

## G. Memory / Knowledge

| Skill | Source | Scope | Enabled | Role |
|---|---|---|---|---|
| claude-mem (mem-search, knowledge-agent, learn-codebase, etc.) | thedotmack | plugin, user | Yes | Recall prior session decisions for this repo |
| graphify | (pre-existing) | skill, user | Yes | Codebase → knowledge graph | Not building a graph yet — no meaningful Phase 1 code exists (see CLAUDE.md rule). |

## H. Web / Research

None dedicated beyond WebFetch/WebSearch tools and `claude-code-guide` agent. No Scrapling found installed; not needed for this project currently.

## I. Other

| Skill | Notes |
|---|---|
| obsidian (defuddle, obsidian-cli, obsidian-markdown, etc.) | Installed, unrelated to this project's current work — no action taken. |
| ai-governors, ai-identifiers, ai-inputs, ai-trust-builders, ai-tuners, ai-wayfinders | Installed (part of awesome-ux-skills bundle). Relevant only if/when an AI feature is authorized (see PROMPTS.md) — not used for Phase 1. |
| ponytail | Session-level narration mode (lazy/minimal-diff enforcement), active this session. Not a project skill — orthogonal to the router above. |

## Conflicts / Duplication Found

- **Token-saving trio** (Caveman, save-tokens, token-saver) do different jobs — see routing table above. Do not stack all three on one task; that compresses reasoning into unreadability.
- **ui-ux-pro-max install also pulled in 5 extra skills** (banner-design, brand, design-system, slides, ui-styling) as part of its bundle — expected behavior of that CLI, not a separate install. All are Phase 2 only.
- No stale/duplicate copies detected between global skills and this project (no project-scoped `.claude/` exists).
- No skill in this audit should apply generic web/Next.js patterns to this React Native project — `awesome-ux-skills`' framework-agnostic critique skills are fine; anything web-DOM-specific (`ui-styling`'s Tailwind/shadcn guidance) is Phase 2 web-adjacent only and should be judged, not blindly applied, if it ever gets used for a React Native screen.
