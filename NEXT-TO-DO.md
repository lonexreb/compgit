# NEXT-TO-DO.md

> Resumable checklist. Anything an agent (human or LLM) could pick up and run with tomorrow morning. Short task statements, no essays — the *why* lives in [`wiki/decisions/`](./wiki/decisions/) and the *how* lives in [`CLAUDE.md`](./CLAUDE.md).

## 🎯 Right now — unblocked, actionable today

### Manually verify Phase 1
- [ ] `pnpm -F @compgit/chrome dev` — Chrome launches with the unpacked extension.
- [ ] Paste a fine-grained PAT in Options → watch the live validation turn green.
- [ ] Popup shows today's count matching `github.com/<you>`.
- [ ] Side panel renders all three tabs (today / heatmap / trends) with real data.
- [ ] Toggle airplane mode → cached data still renders; popup header shows `offline`.
- [ ] Inspect `chrome.storage.local` in DevTools → confirm `contributions:<login>` shape matches `ContributionsCollection`.

### Open the wiki in Obsidian
- [ ] `File → Open Vault` → point at `compgit/wiki/`.
- [ ] Check graph view renders with entity + decision links intact.
- [ ] Confirm `[[wikilinks]]` resolve (`entities/compgit`, `decisions/2026-04-20-pat-first-auth`, etc.).

---

## 🚧 Blocked on a human decision / install

- [ ] **Install full Xcode** (not CLI Tools). Phase 2b can't start until the iOS SDK + WidgetKit are available. `xcode-select --install` is *not* enough.
- [ ] **Apple Developer Program ($99/yr)** — required for running the widget on a real iPhone past 7-day sideload, TestFlight, and App Store submission. Safe to defer until Phase 2b is ready to test on device.
- [ ] **Reserve an OAuth app name + callback domain** (Phase 4). Pick early so branding doesn't thrash.
- [ ] **Team ID for the App Group** — confirm before entitlement clicks. Group ID will be `group.<TEAMID>.compgit`.

---

## 📦 Phase 2b — iOS + macOS Xcode projects

Starts the moment full Xcode is installed.

### 2b.1 — Xcode project shells
- [ ] Create `apps/ios/Compgit.xcodeproj` with targets `CompgitApp` + `CompgitWidgetExtension`. Bundle IDs: `com.<you>.compgit`, `com.<you>.compgit.widget`.
- [ ] Create `apps/macos/Compgit.xcodeproj` with targets `CompgitMacApp` + `CompgitMacWidgetExtension`. Bundle IDs: `com.<you>.compgit.mac`, `com.<you>.compgit.mac.widget`.
- [ ] Add `packages/shared-swift` as a local SPM dependency to both projects (drag folder into Xcode navigator → "Add Local").

### 2b.2 — Entitlements (the half-day of clicking)
- [ ] Enable **App Groups** capability on all four targets; add `group.<TEAMID>.compgit`.
- [ ] Enable **Keychain Sharing** capability on all four targets; access group `$(AppIdentifierPrefix)compgit`.
- [ ] Enable **BackgroundModes → Background fetch** on the iOS app target.

### 2b.3 — iOS host app
- [ ] `CompgitApp.swift` — `@main`, register `BGAppRefreshTask` for 30-min refresh.
- [ ] `ContentView.swift` — PAT entry (reuses `KeychainPAT`), manual refresh button, last-synced timestamp.
- [ ] `RefreshScheduler.swift` — 30-min task that calls `GitHubClient.fetchContributionsCollection` → writes via `SharedStore` → `WidgetCenter.shared.reloadAllTimelines()`.

### 2b.4 — iOS widget
- [ ] `CompgitWidget.swift` — `TimelineProvider`, `Entry`, SwiftUI view for `systemSmall`.
- [ ] Reads from `SharedStore(suiteName: "group.<TEAMID>.compgit")`.
- [ ] Swift Charts sparkline capped at 14 points (memory budget).
- [ ] Interactive refresh via App Intent (iOS 17+).

### 2b.5 — Mirror for macOS
- [ ] Same shape, `systemSmall` + `systemMedium` families.
- [ ] Add `MenuBarExtra` scene to `CompgitMacApp` in Phase 5 (leave a stub).

### 2b.6 — Verify
- [ ] Build to real iPhone, add the widget to Home Screen → today's count matches Chrome.
- [ ] Build to Mac, add the desktop widget → same.
- [ ] Airplane mode on device → widget still renders cached data.
- [ ] Confirm widget memory < 30 MB in Instruments.

---

## 📋 Phase 3 — Comparison across surfaces (10–14h)

- [ ] `packages/shared-ts/src/compare.ts` — parallel fetch w/ concurrency cap of 4; returns `ComparisonRow[]`.
- [ ] `apps/chrome/entrypoints/sidepanel/CompareTab.tsx` — search/add/remove users, uPlot bar chart, period selector.
- [ ] `packages/shared-swift/Sources/CompgitCore/Compare.swift` — Swift mirror.
- [ ] In-app compare view on iOS + macOS (widgets get it in Phase 5).
- [ ] Verify: add `gaearon`, `sindresorhus`, yourself → chart matches their profile graphs; persist across reload.

---

## 📋 Phase 4 — Cloudflare Worker + OAuth (16–22h)

- [ ] `apps/worker/wrangler.toml` — KV `CACHE`, KV `USERS`, secret `GH_CLIENT_SECRET`, custom domain bound.
- [ ] `apps/worker/src/index.ts` — Hono router.
- [ ] `apps/worker/src/routes/auth.ts` — `/auth/start`, `/auth/callback` with PKCE + session JWT.
- [ ] `apps/worker/src/routes/contributions.ts` — KV read-through cache, 1h TTL.
- [ ] `apps/worker/src/routes/follows.ts` — CRUD for followed developers.
- [ ] Chrome migration: `chrome.identity.launchWebAuthFlow` → `/auth/start`.
- [ ] Apple migration: `ASWebAuthenticationSession` → `/auth/start`.
- [ ] Keep PAT mode behind an "Advanced" toggle.
- [ ] Verify: `wrangler dev`, auth round-trip from each surface, KV cache hits visible in logs.

---

## 📋 Phase 5 — Polish + distribution (30–40h, mostly waiting)

- [ ] Hour-of-day analysis via REST `/repos/:o/:r/commits?author=&since=` bucketed by `committer.date`.
- [ ] Lock Screen widget (`accessoryCircular` + `accessoryRectangular`).
- [ ] macOS `MenuBarExtra` scene with mini dropdown.
- [ ] Firefox + Safari + Edge + Brave + Arc zip builds (`wxt build --browser …`).
- [ ] Privacy policy page hosted on the Worker.
- [ ] Chrome Web Store submission ($5 one-time).
- [ ] Firefox AMO submission (free).
- [ ] TestFlight + Mac notarization.

---

## 🧹 Ambient housekeeping

- [ ] Replace placeholder extension icon (currently `public/icon/` is empty; WXT uses a fallback).
- [ ] Consider an XcodeGen `project.yml` so the Xcode projects are version-controlled instead of requiring a wizard.
- [ ] Add component visual-regression tests (Playwright snapshots) — Phase 5, not before.
- [ ] When Xcode lands: re-add a Swift test target. Use Swift Testing (`import Testing`) per the global rule.

---

## For a fresh agent picking this up

1. Read [`CLAUDE.md`](./CLAUDE.md) first (60 seconds).
2. Skim [`MEMORY.md`](./MEMORY.md) for decisions already made.
3. Open [`wiki/Home.md`](./wiki/Home.md) for the knowledge base entry points.
4. Come back here and pick a task from the top unblocked section.
5. On finishing a meaningful unit of work: append to `wiki/daily/<today>.md` and file a new `wiki/decisions/` entry if a choice was made.
