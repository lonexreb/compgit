# MEMORY.md

> Compounding project memory for compgit. Atomic facts, architectural decisions, and pointers into the [wiki](./wiki/). Append here instead of re-deriving things.
>
> Convention: one line per fact, keep entries under ~150 chars, link to the wiki page that explains *why*.

## Project

- Product: [[wiki/entities/compgit]] — GitHub commit tracker across Chrome + iOS + macOS.
- v1 auth is **PAT-first**, no backend. OAuth + Cloudflare Worker arrive in Phase 4. — [[wiki/decisions/2026-04-20-pat-first-auth]]
- Target: solo hobbyist shipping across three surfaces. Full native path, Apple Developer fee accepted.
- Domain owned by user; reserved for Phase 4 OAuth callback.

## Architecture

- One canonical JSON Schema (`packages/schema/compgit.schema.json`) drives TS + Swift codegen. Never hand-sync models. — [[wiki/entities/Schema-As-Source-Of-Truth]]
- quicktype was dropped; `tools/schemagen/generate.ts` is a ~170-LoC hand emitter. Output is deterministic + diff-friendly. — [[wiki/decisions/2026-04-20-hand-rolled-schemagen]]
- Chrome data flow: background alarm → fetch → write `contributions:<login>` → UI subscribes via `chrome.storage.onChanged`. — [[wiki/entities/Background-Fetch-Loop]]
- Shared TS runtime-agnostic (runs in Chrome + Worker + Node tests). Chrome-specific driver lives in `apps/chrome/lib/chrome-storage.ts`. — [[wiki/entities/Shared-TypeScript-Core]]
- Apple side will use separate iOS + macOS Xcode projects with a shared SPM package. macOS App Groups require the Team ID prefix (`group.TEAMID.compgit`).
- Charts are hand-rolled SVG — uPlot + Cal-Heatmap rejected for bundle size and design control. — [[wiki/decisions/2026-04-20-no-cal-heatmap]]

## Conventions

- Design direction: Terminal Editorial (dark, Fraunces serif + JetBrains Mono, one accent). — [[wiki/entities/Terminal-Editorial]]
- Tests are required on `packages/shared-ts/*` (pure modules). No component tests in Phase 1 — UI is verified manually until Phase 5.
- Storage keys are stable contracts: `auth.token`, `me.login`, `contributions:<login>`, `last-sync`.
- Conventional commit prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.

## Gotchas

- GitHub GraphQL has **no ETags**; rate-limit defense is the client TTL cache only. Don't refresh faster than 15 min.
- GitHub Events API is unusable for trends: 90-day window, 30s–6h latency. Use `contributionsCollection` instead.
- Use `committer.date`, not `author.date`, when we add hour-of-day trends (Phase 5) — author date can be backdated via `git commit --date`.
- MV3 service-worker event listeners must register at top level. No `await` before `addListener`.
- Tailwind v4 + WXT requires Vite 6 — WXT ≥ 0.20. Older pins fight each other.
- Widget memory budget on iOS is ~30 MB — cap chart data at 14–50 points.

## Phase progress

- **Phase 0** ✅ monorepo + schema codegen + CI — verified 2026-04-20.
- **Phase 1** ✅ Chrome extension MVP shipped — verified 2026-04-21. See decisions under `wiki/decisions/`.
- **Phase 2** in progress — Swift core shipped (`GitHubClient`, `SharedStore`, `KeychainPAT`, `Aggregate`, `Time`). Xcode projects blocked on full Xcode install.
- **Phase 3** comparison across surfaces — planned.
- **Phase 4** Cloudflare Worker + OAuth — planned, domain ready.
- **Phase 5** polish + store submissions — planned.

## Phase 2 resume notes

- iOS + macOS Xcode projects + widget extensions require full Xcode (not CLI Tools). Install Xcode first, then scaffold via XcodeGen or Xcode's new-project wizard.
- App Group: `group.TEAMID.compgit` — pick the Team ID before creating entitlements; cascading rename is painful.
- Keychain Sharing access group: `$(AppIdentifierPrefix)compgit` — matches `KeychainPAT.accessGroup` constructor arg.
- Swift core surface is live in `packages/shared-swift/Sources/CompgitCore/` — `swift build` is green on CLI Tools.
- Entity page [[wiki/entities/Swift-Core]] (Phase 2) covers the Swift side architecture.

## Pointers

- Agent runbook: [CLAUDE.md](./CLAUDE.md)
- Wiki home: [wiki/Home.md](./wiki/Home.md)
- Decisions: [wiki/decisions/](./wiki/decisions/)
- Daily notes: [wiki/daily/](./wiki/daily/)
