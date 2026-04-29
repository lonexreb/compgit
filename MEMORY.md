# MEMORY.md

> Compounding project memory for compgit. Atomic facts, architectural decisions, and pointers into the [wiki](./wiki/). Append here instead of re-deriving things.
>
> Convention: one line per fact, keep entries under ~150 chars, link to the wiki page that explains *why*.

## Project

- Product: [[wiki/entities/compgit]] — GitHub commit tracker across Chrome + iOS + macOS.
- Repo: <https://github.com/lonexreb/compgit> (public, MIT).
- v1 auth is **PAT-first**, no backend. OAuth + Cloudflare Worker arrive in Phase 4. — [[wiki/decisions/2026-04-20-pat-first-auth]]
- Target: solo hobbyist shipping across three surfaces. Full native path, Apple Developer fee accepted.
- Domain owned by user; reserved for Phase 4 OAuth callback.

## Architecture

- One canonical JSON Schema (`packages/schema/compgit.schema.json`) drives TS + Swift codegen. Never hand-sync models. — [[wiki/entities/Schema-As-Source-Of-Truth]]
- quicktype was dropped; `tools/schemagen/generate.ts` is a ~170-LoC hand emitter. Output is deterministic + diff-friendly. — [[wiki/decisions/2026-04-20-hand-rolled-schemagen]]
- Chrome data flow: background alarm → fetch → write `contributions:<login>` → UI subscribes via `chrome.storage.onChanged`. — [[wiki/entities/Background-Fetch-Loop]]
- Shared TS runtime-agnostic (runs in Chrome + Worker + Node tests). Chrome-specific driver lives in `apps/chrome/lib/chrome-storage.ts`. — [[wiki/entities/Shared-TypeScript-Core]]
- Swift core (`GitHubClient` actor, `SharedStore`, `KeychainPAT`, `Aggregate`, `Time`, `Errors`) mirrors shared-ts by file layout; iOS/macOS widgets will consume it. — [[wiki/entities/Swift-Core]]
- Apple side will use separate iOS + macOS Xcode projects with a shared SPM package. macOS App Groups require the Team ID prefix (`group.TEAMID.compgit`).
- Charts are hand-rolled SVG — uPlot + Cal-Heatmap rejected for bundle size and design control. — [[wiki/decisions/2026-04-20-no-cal-heatmap]]

## Conventions

- Design direction: Terminal Editorial (dark, Fraunces serif + JetBrains Mono, one accent). — [[wiki/entities/Terminal-Editorial]]
- Tests required on `packages/shared-ts/*` (pure modules). No component tests in Phase 1 — UI is verified manually until Phase 5.
- Swift tests return with Phase 2b once full Xcode is installed; use Swift Testing (`import Testing`) per the global rule. — [[wiki/decisions/2026-04-21-removed-swift-tests]]
- Storage keys are stable contracts across Chrome + Swift: `auth.token`, `me.login`, `contributions:<login>`, `last-sync`. Phase 3 adds `follows` + `compare:<login>` (1h TTL) — see [[wiki/entities/Compare-Surface]]. Phase 6 adds `telemetry.optIn` — see [[wiki/entities/Telemetry-And-Support]].
- Conventional commit prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `perf:`, `test:`, `ci:`.
- Obsidian wiki is the knowledge base. Entity pages, dated decisions, daily notes — all cross-linked with `[[wikilinks]]`.

## Gotchas

- GitHub GraphQL has **no ETags**; rate-limit defense is the client TTL cache only. Don't refresh faster than 15 min.
- GitHub Events API is unusable for trends: 90-day window, 30s–6h latency. Use `contributionsCollection` instead.
- Use `committer.date`, not `author.date`, when we add hour-of-day trends (Phase 5) — author date can be backdated via `git commit --date`.
- MV3 service-worker event listeners must register at top level. No `await` before `addListener`.
- Tailwind v4 + WXT requires Vite 6 — WXT ≥ 0.20. Older pins fight each other.
- Widget memory budget on iOS is ~30 MB — cap chart data at 14–50 points.
- `swift build` on the dev machine uses Command Line Tools (no iOS SDK). CI runs the same command on macos-14 with Xcode 15.
- CI workflow lives at repo root (`.github/workflows/ci.yml`) — the `compgit/` folder IS the repo root now.
- `GitHubClient` (TS + Swift) gets a `baseURL` arg in pre-Phase-2b prep so Phase 4 can flip from `api.github.com/graphql` to the Worker without rewriting call sites. Heuristic for Apple OAuth bearer vs. PAT: bearer starts with `eyJ`. — see [[wiki/entities/OAuth-Worker]].
- Sentry / heartbeat / status page wiring is **Phase 6**, not "polish". Privacy-policy retention numbers live in [[wiki/entities/Telemetry-And-Support]] and are referenced verbatim by the storefront listings in [[wiki/entities/Distribution-And-Release]].

## Phase progress

- **Phase 0** ✅ monorepo + schema codegen + CI — verified 2026-04-20.
- **Phase 1** ✅ Chrome extension MVP shipped — verified 2026-04-21.
- **Phase 2a** ✅ Swift core (`GitHubClient`, `SharedStore`, `KeychainPAT`, `Aggregate`, `Time`, `Errors`) — `swift build` green 2026-04-21.
- **Phase 2b** 🟡 iOS + macOS apps + widget extensions — blocked on full Xcode. Architecture: [[wiki/entities/Apple-Surfaces]].
- **Phase 3** 📋 follow + compare across surfaces — [[wiki/entities/Compare-Surface]].
- **Phase 4** 📋 Cloudflare Worker + OAuth + KV — [[wiki/entities/OAuth-Worker]] (domain ready).
- **Phase 5** 📋 store submissions + polish — [[wiki/entities/Distribution-And-Release]].
- **Phase 6** 📋 telemetry + support — [[wiki/entities/Telemetry-And-Support]].

Plan was expanded end-to-end on 2026-04-29 — see [[wiki/decisions/2026-04-29-end-to-end-plan-expansion]]. Each phase's `Verify:` lines and exit gate live in [NEXT-TO-DO.md](./NEXT-TO-DO.md).

## Phase 2b resume notes

- Xcode required: iOS SDK + WidgetKit + SwiftUI previews. `xcode-select --install` (CLI Tools) is not sufficient.
- App Group: `group.<TEAMID>.compgit` — pick the Team ID before creating entitlements; cascading rename is painful.
- Keychain Sharing access group: `$(AppIdentifierPrefix)compgit` — matches `KeychainPAT(accessGroup:)` constructor arg.
- Swift core is ready to consume — structure and surface area in [[wiki/entities/Swift-Core]].
- Consider generating `.xcodeproj` via XcodeGen (`project.yml`) so the project stays version-controlled.

## Pointers

- Agent runbook: [CLAUDE.md](./CLAUDE.md)
- Resumable TODO: [NEXT-TO-DO.md](./NEXT-TO-DO.md)
- Wiki home: [wiki/Home.md](./wiki/Home.md)
- Entities: [wiki/entities/](./wiki/entities/)
- Decisions: [wiki/decisions/](./wiki/decisions/)
- Daily notes: [wiki/daily/](./wiki/daily/)
