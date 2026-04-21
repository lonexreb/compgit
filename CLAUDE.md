# CLAUDE.md

> Operating manual for agents working in this repo. If you're an LLM, read this file first — it's the shortest path to being useful here.

## 1. What is this project

**compgit** is a cross-platform GitHub commit tracker. Three surfaces — Chrome extension, iPhone widget, macOS widget — all share one JSON Schema and one data model. It shows today's commits, a year heatmap, day/week/month/year trends, and a comparison tab against developers you follow. v1 auth is a user-pasted fine-grained PAT; OAuth + a Cloudflare Worker arrive in Phase 4.

Project status, phased roadmap, and end-to-end verification steps live in [`wiki/Home.md`](./wiki/Home.md).

## 2. Repository structure

pnpm workspaces + Turborepo monorepo.

```
compgit/
├── apps/
│   ├── chrome/      WXT + React + Tailwind v4 extension     (Phase 1, shipped)
│   ├── ios/         Xcode project                           (Phase 2)
│   ├── macos/       Xcode project                           (Phase 2)
│   └── worker/      Cloudflare Worker + Hono                (Phase 4)
├── packages/
│   ├── schema/      compgit.schema.json — canonical models
│   ├── shared-ts/   GitHub client, cache, aggregation, auth, time (Vitest)
│   └── shared-swift/ Swift package mirroring shared-ts      (Phase 2)
├── tools/
│   └── schemagen/   Hand-rolled JSON Schema → TS + Swift emitter
└── wiki/            Obsidian vault — project knowledge base
```

**Data flow in the Chrome extension:** user pastes PAT in Options → background service worker runs on a 15-min alarm → fetches `user.contributionsCollection.contributionCalendar` via GraphQL → writes `ContributionsCollection` to `chrome.storage.local` under `contributions:<login>` → popup + side panel subscribe via `useStorageValue` and re-render.

## 3. Commands

All commands run from the `compgit/` root unless noted.

```bash
# One-time setup
pnpm install

# The inner loop
pnpm gen:schema                # regen generated.ts + Generated.swift from compgit.schema.json
pnpm test                      # vitest over packages/shared-ts
pnpm typecheck                 # tsc --noEmit across workspaces (via Turbo)
pnpm lint                      # biome check
pnpm format                    # biome format --write

# Chrome extension
pnpm -F @compgit/chrome dev             # launches Chrome with unpacked extension
pnpm -F @compgit/chrome build           # prod build → .output/chrome-mv3/
pnpm -F @compgit/chrome build:firefox   # Firefox zip for AMO

# Schema drift gate (matches CI)
pnpm check:schema-drift        # regens then git-diff-exits-nonzero if drift

# Shared Swift package (Phase 2 target, builds on macOS with Xcode CLI Tools)
cd packages/shared-swift && swift build
```

## 4. Conventions — what to do and what not to do

**Canonical model lives in one place.** `packages/schema/compgit.schema.json` is the source of truth. Never hand-edit `packages/shared-ts/src/generated.ts` or `packages/shared-swift/Sources/CompgitSchema/Generated.swift` — those are emitted by `tools/schemagen/generate.ts`. After a schema change, run `pnpm gen:schema` and commit the emitted files together with the schema.

**Extension storage keys are stable contracts.** `auth.token`, `me.login`, `contributions:<login>`, `last-sync`. Don't rename them without migrating users.

**Background service worker is MV3.** Top-level listener registration only; no async work before `chrome.runtime.onMessage.addListener`. Async message handlers must return `true` to keep the channel open. See `apps/chrome/entrypoints/background.ts`.

**All GitHub requests go through `shared-ts/src/github/graphql.ts`.** It returns typed errors (`AuthError`, `RateLimitError`, `NetworkError`, `ValidationError`). Don't swallow errors in the UI — render them; see `Options.tsx` `StateLine` for the pattern.

**Design tokens, not hard-coded values.** All colours, type sizes, spacing, motion durations live in `apps/chrome/styles/tokens.css`. Tailwind v4's `@theme` block in `global.css` maps tokens to utility classes (`text-text-muted`, `bg-bg`, `font-display`). Don't introduce new one-off hex values in components.

**Charts are hand-rolled SVG.** uPlot and Cal-Heatmap were considered and rejected — the `Sparkline`, `Heatmap`, and `TrendChart` components are ~100 LoC each of pure SVG so that the extension stays visually coherent and the bundle stays small. Keep it that way unless a chart genuinely exceeds what SVG can express.

**Tests target pure logic in shared-ts.** `aggregate.ts`, `cache.ts`, `github/graphql.ts`, `time.ts`, `auth.ts`, `storage.ts` all have colocated `*.test.ts`. Coverage gate is 80%. Don't add unit tests for React components in Phase 1 — UI verification is manual until Phase 5.

**Each phase must be verifiable before moving on.** The [wiki's decisions log](./wiki/decisions/) documents the planning + checkpoints. Don't start Phase N+1 while Phase N's verification checklist is open.

**UI direction is "Terminal Editorial".** Dark by default, Fraunces for display numerals, JetBrains Mono for body. Exactly one accent colour per view. No shadows, no gradients, rounded corners ≤ 2px. If a new screen needs a different vibe, open a decision in `wiki/decisions/` before diverging.

**Never commit secrets.** No `.env`, no `GH_CLIENT_SECRET`, no PATs. The user's token lives in `chrome.storage.local` on their device only. The Cloudflare Worker secret (Phase 4) is set via `wrangler secret put`, never checked in.

## 5. When something is unclear

- **Architectural question:** check the matching entity page in `wiki/entities/`. The page either answers the question directly or links to the decision that settled it.
- **"Why did we do X this way?":** look in `wiki/decisions/` — decisions are dated and name the alternative considered.
- **Unsure what phase a feature belongs to:** see the roadmap in `wiki/Home.md`.
- **Adding memory/learnings across sessions:** append to `MEMORY.md` as an atomic fact or link to a new page in `wiki/entities/`.

## 6. What success looks like for an agent

An agent running in this repo should:
1. Read `CLAUDE.md` and `MEMORY.md` before making assumptions.
2. Run `pnpm test && pnpm typecheck && pnpm lint && pnpm check:schema-drift` before reporting "done".
3. When finishing a meaningful unit of work, add a dated entry to `wiki/decisions/` (if it was a choice) or `wiki/daily/` (if it was progress), and update any affected entity page.
4. Commit using conventional prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).

That is the whole manual.
