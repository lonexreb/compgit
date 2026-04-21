# CLAUDE.md

> Operating manual for agents working in this repo. If you're an LLM, read this file first — it's the shortest path to being useful here.

## 1. What is this project

**compgit** is a cross-platform GitHub commit tracker. Three surfaces — Chrome extension, iPhone widget, macOS widget — all share one JSON Schema and one data model. It shows today's commits, a year heatmap, day/week/month/year trends, and a comparison tab against developers you follow. v1 auth is a user-pasted fine-grained PAT; OAuth + a Cloudflare Worker arrive in Phase 4.

Status in two lines: Phases 0, 1, and Phase 2a (Swift core) shipped. Phase 2b (Xcode projects for iOS + macOS) is blocked on full Xcode being installed. Full roadmap + verification per phase lives in [`wiki/Home.md`](./wiki/Home.md); resumable TODO list in [`NEXT-TO-DO.md`](./NEXT-TO-DO.md).

## 2. Repository structure

pnpm workspaces + Turborepo monorepo. The `compgit/` folder *is* the repo root — the GitHub repo is <https://github.com/lonexreb/compgit> (public, MIT).

```
compgit/
├── apps/
│   ├── chrome/      WXT + React + Tailwind v4 extension     ✅ Phase 1, shipped
│   ├── ios/         Xcode project                           🟡 Phase 2b
│   ├── macos/       Xcode project                           🟡 Phase 2b
│   └── worker/      Cloudflare Worker + Hono                📋 Phase 4
├── packages/
│   ├── schema/      compgit.schema.json — canonical models
│   ├── shared-ts/   GitHub client, cache, aggregation, auth, time (Vitest)
│   └── shared-swift/ CompgitSchema + CompgitCore (Swift 5.10, iOS 17+/macOS 14+)  ✅
├── tools/
│   └── schemagen/   Hand-rolled JSON Schema → TS + Swift emitter
├── wiki/            Obsidian vault — project knowledge base
├── assets/          SVG banner + static assets
├── CLAUDE.md        This file
├── MEMORY.md        Compounding project memory
├── NEXT-TO-DO.md    Resumable checklist
└── README.md
```

**Data flow — Chrome extension:** user pastes PAT in Options → background service worker runs on a 15-min alarm → fetches `user.contributionsCollection.contributionCalendar` via GraphQL → writes `ContributionsCollection` to `chrome.storage.local` under `contributions:<login>` → popup + side panel subscribe via `useStorageValue` and re-render.

**Data flow — Apple widgets (Phase 2b):** host app uses `GitHubClient` (actor) → writes via `SharedStore(suiteName: "group.TEAMID.compgit")` → calls `WidgetCenter.reloadAllTimelines()` → widget extension's `TimelineProvider` reads the same shared container. Never hit the network from the widget extension itself.

## 3. Commands

All commands run from the repo root unless noted.

```bash
# One-time setup
pnpm install

# The inner loop
pnpm gen:schema                # regen generated.ts + Generated.swift from compgit.schema.json
pnpm test                      # vitest over packages/shared-ts (41 tests)
pnpm typecheck                 # tsc --noEmit across workspaces (via Turbo)
pnpm lint                      # biome check
pnpm format                    # biome format --write

# Chrome extension
pnpm -F @compgit/chrome dev             # launches Chrome with unpacked extension
pnpm -F @compgit/chrome build           # prod build → .output/chrome-mv3/
pnpm -F @compgit/chrome build:firefox   # Firefox zip for AMO

# Schema drift gate (matches CI)
pnpm check:schema-drift        # regens then git-diff-exits-nonzero if drift

# Swift core — builds on macOS Command Line Tools (iOS 17+/macOS 14+ platform targets)
cd packages/shared-swift && swift build
```

## 4. Conventions — what to do and what not to do

**Canonical model lives in one place.** `packages/schema/compgit.schema.json` is the source of truth. Never hand-edit `packages/shared-ts/src/generated.ts` or `packages/shared-swift/Sources/CompgitSchema/Generated.swift` — those are emitted by `tools/schemagen/generate.ts`. After a schema change, run `pnpm gen:schema` and commit the emitted files together with the schema.

**Storage keys are stable contracts across Chrome + Swift.** `auth.token`, `me.login`, `contributions:<login>`, `last-sync`. Both the Chrome extension (`chrome.storage.local`) and the iOS/macOS apps (`SharedStore` via App-Group `UserDefaults`) use these verbatim. Don't rename them without migrating users on both sides.

**Background service worker is MV3.** Top-level listener registration only; no async work before `chrome.runtime.onMessage.addListener`. Async message handlers must return `true` to keep the channel open. See `apps/chrome/entrypoints/background.ts`.

**All GitHub requests go through the shared client.** On the TS side: `packages/shared-ts/src/github/graphql.ts`. On the Swift side: `GitHubClient` in `packages/shared-swift/Sources/CompgitCore/`. Both return typed errors (`AuthError`/`RateLimitError`/`NetworkError`/`ValidationError` in TS; `CompgitError` cases in Swift). Don't swallow errors in the UI — render them (see `Options.tsx` `StateLine` for the pattern).

**Design tokens, not hard-coded values.** All colours, type sizes, spacing, motion durations live in `apps/chrome/styles/tokens.css`. Tailwind v4's `@theme` block in `global.css` maps tokens to utility classes (`text-text-muted`, `bg-bg`, `font-display`). Don't introduce new one-off hex values in components. When Phase 2b ships, Swift views follow the same palette — define equivalents in a `Tokens.swift` constant so the two platforms stay aligned.

**Charts are hand-rolled SVG on the web, Swift Charts on Apple.** uPlot and Cal-Heatmap were considered and rejected — the `Sparkline`, `Heatmap`, and `TrendChart` components are ~100 LoC each of pure SVG so that the extension stays visually coherent and the bundle stays small. On the Apple side, use Swift Charts directly but cap widget data at 14–50 points for the 30 MB memory budget.

**Tests target pure logic in shared-ts today; Swift tests land in Phase 2b.** `aggregate.ts`, `cache.ts`, `github/graphql.ts`, `time.ts`, `auth.ts`, `storage.ts` all have colocated `*.test.ts` (80% gate). Don't add unit tests for React components in Phase 1 — UI verification is manual until Phase 5. Swift tests were intentionally skipped in Phase 0 ([[wiki/decisions/2026-04-21-removed-swift-tests]]); they return with Phase 2b using Swift Testing (`import Testing`).

**Each phase must be verifiable before moving on.** The [wiki's decisions log](./wiki/decisions/) documents the planning + checkpoints. Don't start Phase N+1 while Phase N's verification checklist is open. Phase-2b-specific checklist lives in [`NEXT-TO-DO.md`](./NEXT-TO-DO.md).

**UI direction is "Terminal Editorial".** Dark by default, Fraunces for display numerals, JetBrains Mono for body. Exactly one accent colour per view. No shadows, no gradients, rounded corners ≤ 2px. If a new screen needs a different vibe, open a decision in `wiki/decisions/` before diverging.

**Never commit secrets.** No `.env`, no `GH_CLIENT_SECRET`, no PATs. The user's token lives in `chrome.storage.local` on-device (Chrome) or in the Keychain via `KeychainPAT` (Apple). The Cloudflare Worker secret (Phase 4) is set via `wrangler secret put`, never checked in.

## 5. When something is unclear

- **Architectural question:** check the matching entity page in [`wiki/entities/`](./wiki/entities/). The page either answers directly or links to the decision that settled it.
- **"Why did we do X this way?":** look in [`wiki/decisions/`](./wiki/decisions/) — decisions are dated and name the alternative considered.
- **What's the next actionable thing?:** [`NEXT-TO-DO.md`](./NEXT-TO-DO.md). It distinguishes "unblocked today" from "blocked on a human" and breaks remaining phases into checkable tasks.
- **Unsure what phase a feature belongs to:** see the roadmap in [`wiki/Home.md`](./wiki/Home.md).
- **Adding memory/learnings across sessions:** append to [`MEMORY.md`](./MEMORY.md) as an atomic fact, or create a new page in `wiki/entities/`.

## 6. What success looks like for an agent

An agent running in this repo should:

1. Read `CLAUDE.md`, `MEMORY.md`, and `NEXT-TO-DO.md` before making assumptions.
2. Pick a task from the top "unblocked" section of `NEXT-TO-DO.md`, not from the bottom of the backlog.
3. Before reporting "done", run the appropriate subset of:
   - `pnpm test && pnpm typecheck && pnpm lint && pnpm check:schema-drift` (TS work)
   - `cd packages/shared-swift && swift build` (Swift work)
   - `pnpm -F @compgit/chrome build` (extension packaging changes)
4. When finishing a meaningful unit of work, add a dated entry to `wiki/daily/<today>.md`, file a new `wiki/decisions/YYYY-MM-DD-slug.md` if a fork was chosen, and update any affected entity page.
5. Update `MEMORY.md` when a new atomic fact crosses session boundaries (something a future agent needs but can't derive from the code).
6. Commit using conventional prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `perf:`, `test:`, `ci:`) and push to `origin/main`.

That is the whole manual.
