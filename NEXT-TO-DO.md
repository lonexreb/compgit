# NEXT-TO-DO.md

> Resumable end-to-end checklist. Anything an agent (human or LLM) could pick up and run with tomorrow morning. Each phase: prerequisites → scope → tasks → exit gate → estimate. The *why* lives in [`wiki/decisions/`](./wiki/decisions/), the *how* lives in [`CLAUDE.md`](./CLAUDE.md), and per-phase architecture lives in the linked entity page.
>
> The plan was rewritten end-to-end on 2026-04-29 — see [[wiki/decisions/2026-04-29-end-to-end-plan-expansion]] for the rationale and the entity pages it produced.

## How to use this file

1. **Pick from "Right now" first.** Don't reach into a later phase if anything in the unblocked section is open.
2. **Each task has a verification line.** Don't tick the box until the verification passes locally.
3. **Each phase has an exit gate.** All sub-task verifications green ⇒ exit gate passes ⇒ phase complete. Open the next phase's prerequisites.
4. **Update the wiki on each meaningful unit.** Append to `wiki/daily/<today>.md`; file a `wiki/decisions/YYYY-MM-DD-slug.md` if a fork was chosen; update any affected entity page.
5. **Commit on each small change with a conventional prefix** (`feat:` / `fix:` / `docs:` / `refactor:` / `chore:` / `perf:` / `test:` / `ci:`) and push.

---

## 🎯 Right now — unblocked, actionable today

### Manually verify Phase 1 on a real browser
- [ ] `pnpm -F @compgit/chrome dev` — Chrome launches with the unpacked extension. **Verify:** the puzzle-piece icon appears in the toolbar.
- [ ] Paste a fine-grained PAT (scopes: `read:user`) in Options → live-validation badge turns green within 1s. **Verify:** invalid PATs flip to red with the GraphQL error string.
- [ ] Popup shows today's count matching `github.com/<you>`. **Verify:** the Fraunces numeral matches the green square count on your contribution graph.
- [ ] Side panel renders all three tabs (Today / Heatmap / Trends) with real data. **Verify:** keyboard nav (`Tab`/`←→`) cycles tabs; URL hash updates.
- [ ] Toggle airplane mode → cached data still renders; popup header shows `offline`. **Verify:** no spinner; `last-sync` timestamp visible.
- [ ] Inspect `chrome.storage.local` in DevTools → confirm `contributions:<login>` shape matches `ContributionsCollection`. **Verify:** `total`, `weeks[].days[].contributionCount`, `weeks[].days[].date` all present.

### Open the wiki in Obsidian
- [ ] `File → Open Vault` → point at `compgit/wiki/`.
- [ ] **Verify:** graph view renders with entity + decision + daily nodes.
- [ ] **Verify:** `[[wikilinks]]` resolve (`entities/compgit`, `decisions/2026-04-20-pat-first-auth`, `entities/Apple-Surfaces`, `entities/OAuth-Worker`, …).

---

## 🚧 Blocked on a human decision / install

- [ ] **Install full Xcode** (not CLI Tools). Phase 2b can't start until the iOS SDK + WidgetKit are available. `xcode-select --install` is *not* enough. Get it from the Mac App Store; ~14 GB.
- [ ] **Apple Developer Program ($99/yr)** — required for running the widget on a real iPhone past 7-day sideload, TestFlight, and App Store submission. Defer until Phase 2b is ready to test on device.
- [ ] **Reserve OAuth app name + callback domain** (Phase 4). Pick early so branding doesn't thrash. Bind the chosen domain to the Worker.
- [ ] **Team ID for the App Group** — confirm before entitlement clicks. Group ID will be `group.<TEAMID>.compgit`. Find it in <https://developer.apple.com/account> → Membership.
- [ ] **Sentry account** (Phase 6) — free tier covers all three surfaces; create a single org with three projects (`compgit-chrome`, `compgit-ios`, `compgit-macos`).

---

## 🛠 Pre-Phase-2b prep — can run today, no Xcode required

These move work *out of* the entitlement-click half-day so Phase 2b lands faster.

- [ ] **Add an XcodeGen `project.yml`** to `apps/ios/` and `apps/macos/`. Brew install: `brew install xcodegen`. Pin to a major version. **Verify:** `xcodegen generate` (run later, post-Xcode) regenerates the same `.xcodeproj` from the YAML.
- [ ] **Sketch `Tokens.swift`** in `packages/shared-swift/Sources/CompgitCore/` mirroring `apps/chrome/styles/tokens.css`. Pure constants — no `import SwiftUI`. **Verify:** `swift build` stays clean; values match the CSS hex values byte-for-byte.
- [ ] **Add `baseURL` to `GitHubClient`** in shared-swift (default `https://api.github.com/graphql`) so Phase 4 can flip it to the Worker without rewriting. **Verify:** `swift build` clean; no behavior change for existing call sites.
- [ ] **Mirror `baseURL` in `packages/shared-ts/src/github/graphql.ts`.** **Verify:** `pnpm test && pnpm typecheck` green.
- [ ] **Replace WXT placeholder icon** in `apps/chrome/public/icon/` (16/32/48/128). **Verify:** `pnpm -F @compgit/chrome build` shows the new icon in `.output/chrome-mv3/icon/`.

---

## 📦 Phase 2b — iOS + macOS Xcode projects + widgets

> **Architecture:** [[wiki/entities/Apple-Surfaces]]. Starts the moment full Xcode is installed.
>
> **Estimate:** 12–16h, of which ~4h is Apple Developer + entitlement clicking. Code is small.

### 2b.1 — Project shells
- [ ] Create `apps/ios/Compgit.xcodeproj` (or `xcodegen generate` from the prep YAML). Targets: `CompgitApp` + `CompgitWidgetExtension`. Bundle IDs: `com.<you>.compgit`, `com.<you>.compgit.widget`. **Verify:** opens in Xcode; both targets build to a simulator.
- [ ] Create `apps/macos/Compgit.xcodeproj` with `CompgitMacApp` + `CompgitMacWidgetExtension`. Bundle IDs: `com.<you>.compgit.mac`, `com.<you>.compgit.mac.widget`. **Verify:** macOS app launches an empty window.
- [ ] Add `packages/shared-swift` as a local SPM dependency to both projects. **Verify:** `import CompgitCore` resolves in both host apps and both widget extensions.

### 2b.2 — Entitlements (the half-day of clicking)
- [ ] Enable **App Groups** on all four targets; add `group.<TEAMID>.compgit`. **Verify:** Apple Developer portal shows the group attached to all four App IDs.
- [ ] Enable **Keychain Sharing** on all four targets; access group `$(AppIdentifierPrefix)compgit`. **Verify:** `KeychainPAT(accessGroup: "$(AppIdentifierPrefix)compgit").save("test")` works in both host and widget.
- [ ] Enable **BackgroundModes → Background fetch** on the iOS app target. **Verify:** Info.plist shows `UIBackgroundModes: [fetch]`.
- [ ] Add `BGTaskSchedulerPermittedIdentifiers` to the iOS Info.plist with `com.<you>.compgit.refresh`. **Verify:** `BGTaskScheduler.shared.register(forTaskWithIdentifier:…)` doesn't throw at launch.

### 2b.3 — iOS host app
- [ ] `CompgitApp.swift` — `@main`, register `BGAppRefreshTask "com.<you>.compgit.refresh"` for 30-min refresh. **Verify:** task fires from `BGTaskScheduler` debug menu; logs show `RefreshScheduler.run`.
- [ ] `ContentView.swift` — PAT entry (reuses `KeychainPAT`), manual refresh button, last-synced timestamp, error line. **Verify:** paste valid PAT → button reachable → tapping fetches → SwiftUI text shows the same `total` as Chrome.
- [ ] `RefreshScheduler.swift` — calls `GitHubClient.fetchContributionsCollection` → writes via `SharedStore` → `WidgetCenter.shared.reloadAllTimelines()`. **Verify:** widget on Home Screen updates within 5s of a manual refresh.

### 2b.4 — iOS widget extension
- [ ] `CompgitWidget.swift` — `TimelineProvider`, `Entry`, SwiftUI view for `systemSmall`. **Verify:** add to Home Screen; placeholder + snapshot + getTimeline all return non-empty.
- [ ] Reads from `SharedStore(suiteName: "group.<TEAMID>.compgit")`; never networks. **Verify:** disable network → widget still renders cached data.
- [ ] Swift Charts sparkline capped at 14 points (memory budget). **Verify:** Instruments shows widget extension peak < 30 MB.
- [ ] Interactive refresh via App Intent (iOS 17+). **Verify:** tap the refresh affordance → host app opens, refreshes, returns to Home Screen.

### 2b.5 — Mirror for macOS
- [ ] Same shape, `systemSmall` + `systemMedium` families. **Verify:** drag desktop widget to wallpaper; both sizes render.
- [ ] Add a `MenuBarExtra` scene to `CompgitMacApp` as a stub (Phase 5 fills it in). **Verify:** menu bar icon appears, dropdown shows "Coming soon".

### 2b.6 — Exit gate
- [ ] Build to a real iPhone, add the widget to Home Screen → today's count matches Chrome and `github.com/<you>`.
- [ ] Build to Mac, add the desktop widget → same number.
- [ ] Airplane mode on either device → widget still renders cached data.
- [ ] Confirm widget memory < 30 MB in Instruments.
- [ ] Quit the iOS host app → widget refreshes for at least one cycle (proves App Group + Keychain reads work without the host process).
- [ ] Re-add a Swift test target using Swift Testing (`import Testing`); first test asserts `GitHubClient` decodes a fixture. **Verify:** `swift test` green.
- [ ] Commit `wiki/daily/<today>.md` documenting verification + any new decisions filed.

---

## 📋 Phase 3 — Comparison across surfaces

> **Architecture:** [[wiki/entities/Compare-Surface]]. **Estimate:** 10–14h.

### 3.1 — Aggregator
- [ ] `packages/shared-ts/src/compare.ts` — `runCompare(follows, viewerLogin)` returning `ComparisonRow[]`, parallel-fetch with concurrency cap of 4, per-login `compare:<login>` cache (1h TTL via `cache.ts`). **Verify:** Vitest with 20 mocked logins finishes in < 1.5s simulated time; `Promise.all` would have hit the budget cap.
- [ ] `packages/shared-swift/Sources/CompgitCore/Compare.swift` — `actor CompareAggregator` mirroring the TS shape. **Verify:** `swift build` clean; new test fixture passes.
- [ ] Schema additions: add `FollowList` and `ComparisonRow` to `packages/schema/compgit.schema.json`; regenerate. **Verify:** `pnpm check:schema-drift` passes.

### 3.2 — Chrome side panel
- [ ] `apps/chrome/entrypoints/sidepanel/CompareTab.tsx` — search via `users(login:)` GraphQL (debounced 300ms), add/remove rows, period selector (today/7d/30d/365d). **Verify:** add `gaearon`, `sindresorhus`, yourself → totals match the public profile graphs for each period.
- [ ] `apps/chrome/entrypoints/sidepanel/CompareChart.tsx` — uPlot horizontal bar chart, viewer pinned, error rows strikethrough with badge. **Verify:** rate-limited follower (artificially set to a low-budget PAT) renders with `429` badge, no UI crash.
- [ ] Persist `follows` under the same key on Chrome and Apple. **Verify:** add a follower in Chrome; iOS app (post-2b) reads it.

### 3.3 — Apple in-app compare
- [ ] iOS / macOS host apps gain a `CompareView` tab — Swift Charts horizontal bar, swipe-to-remove. **Verify:** same followers, same totals as Chrome.

### 3.4 — Exit gate
- [ ] Add three followers on Chrome → numbers match their profile graphs for all four periods.
- [ ] Remove a follower → row disappears, `compare:<login>` cache key purged.
- [ ] Toggle network off → cached rows render with a "stale" badge and the `fetchedAt` timestamp.
- [ ] iOS app shows the same followers list (proves storage parity).
- [ ] `pnpm test && pnpm typecheck && pnpm lint && pnpm check:schema-drift` all green; `swift build` green.
- [ ] Commit + daily note + any decisions filed.

---

## 📋 Phase 4 — Cloudflare Worker + OAuth

> **Architecture:** [[wiki/entities/OAuth-Worker]]. **Estimate:** 16–22h, of which ~4h is OAuth app config + domain + reviewer-readable privacy policy.

### 4.1 — Scaffolding
- [ ] `apps/worker/package.json` workspace, `wrangler.toml` with KV bindings `CACHE` + `USERS`. **Verify:** `wrangler dev` boots; `/health` returns 200 with `kv: ok`.
- [ ] `wrangler secret put GH_CLIENT_SECRET` (production); `.dev.vars` for local. **Verify:** `wrangler dev` reads the secret without printing it.
- [ ] `wrangler secret put JWT_SIGNING_KEY` — generate via `openssl rand -base64 64`. Document in `wiki/entities/OAuth-Worker.md` how to rotate.
- [ ] Bind a custom domain (e.g. `api.compgit.<domain>`) — Workers route. **Verify:** `curl https://api.compgit.<domain>/health` succeeds.

### 4.2 — Routes
- [ ] `src/routes/auth.ts` — `/auth/start`, `/auth/callback`, `/auth/logout` with PKCE + JWT. **Verify:** unit test (Vitest + Miniflare) round-trips a mock GitHub.
- [ ] `src/routes/contributions.ts` — KV read-through cache, 1h TTL. **Verify:** second request to the same login serves from KV (log shows `cacheHit: true`).
- [ ] `src/routes/follows.ts` — CRUD for `FollowList`, owner = session login. **Verify:** can't read another user's follows.
- [ ] `src/routes/me.ts` — viewer info from session. **Verify:** unauthenticated request returns 401 with the typed error shape.

### 4.3 — Chrome migration
- [ ] Options page: add "Sign in with GitHub" primary button + "Use a token instead" advanced toggle. **Verify:** clicking the primary button opens the OAuth window; on success, `chrome.storage.local.auth.token` becomes a JWT.
- [ ] Background worker: detect mode and call `<worker>/contributions` instead of GraphQL when in OAuth mode. **Verify:** Worker logs show fetches; popup still renders today's count.

### 4.4 — Apple migration
- [ ] Host apps: `ASWebAuthenticationSession` flow, store bearer in Keychain. **Verify:** OAuth round-trip from iOS sim and Mac.
- [ ] `GitHubClient` `baseURL` flips to `<worker>` when bearer is a JWT (heuristic: starts with `eyJ`). **Verify:** widget still refreshes within one cycle.

### 4.5 — Privacy policy + status page
- [ ] `apps/worker/src/static/privacy.html` — lists data collected per [[wiki/entities/Telemetry-And-Support]] retention table. **Verify:** loads at `https://api.compgit.<domain>/privacy`.
- [ ] Stub a `status.html` that polls `/health`. **Verify:** flipping a Worker env var off shows status red within 60s.

### 4.6 — Exit gate
- [ ] Sign-in round-trip from Chrome, iOS, macOS — each surface persists a bearer and refreshes contributions through the Worker.
- [ ] KV inspector shows `contributions:<login>` populated, TTL respected.
- [ ] Pull network mid-flow → cached rows still render with correct `fetchedAt`.
- [ ] Rotate `JWT_SIGNING_KEY` → all sessions invalidated; users re-sign-in cleanly.
- [ ] PAT mode still works behind the Advanced toggle (regression check).
- [ ] Privacy policy URL resolves and matches the data flow.

---

## 📋 Phase 5 — Polish + distribution

> **Architecture:** [[wiki/entities/Distribution-And-Release]]. **Estimate:** 30–40h, mostly review-wait + screenshots.

### 5.1 — Polish
- [ ] Hour-of-day analysis via REST `/repos/:o/:r/commits?author=&since=` bucketed by `committer.date`. **Verify:** radial chart on side panel renders 24-hour distribution; matches a quick `git log --pretty=%cI` sanity check.
- [ ] Lock Screen widget (`accessoryCircular` + `accessoryRectangular`). **Verify:** add to Lock Screen on iPhone; today's count visible without unlock.
- [ ] macOS `MenuBarExtra` scene — mini dropdown with today + sparkline + refresh. **Verify:** click bar icon, dropdown renders, Refresh Now updates within 1s.

### 5.2 — Per-store submissions
- [ ] **Chrome Web Store** ($5 once). **Verify:** zip uploads, reviewer accepts within 1–7 days.
- [ ] **Firefox AMO**. **Verify:** zip uploads, reviewer accepts.
- [ ] **Microsoft Edge Add-ons** (reuses CWS zip). **Verify:** reviewer accepts.
- [ ] **App Store iOS** + macOS (single record). **Verify:** TestFlight build available; production review accepts.
- [ ] **Direct `.dmg`** notarized + stapled. **Verify:** download → Gatekeeper accepts without override.
- [ ] **Safari Web Extension** via `xcrun safari-web-extension-converter`. **Verify:** macOS app embeds the extension; appears in Safari Extensions preferences.

### 5.3 — Release engineering
- [ ] `pnpm release` script: bumps `package.json#version`, mirrors to Xcode `MARKETING_VERSION`, creates a `vX.Y.Z` tag. **Verify:** dry-run prints the diff; real run pushes the tag.
- [ ] `.github/workflows/release.yml` — builds all extension zips on tag push, drafts a GitHub Release with the artefacts attached. **Verify:** push a `v0.9.0-rc1` tag; release shows `compgit-chrome.zip`, `compgit-firefox.zip`.
- [ ] `.github/RELEASE_TEMPLATE.md` per-surface template. **Verify:** the drafted release uses it.

### 5.4 — Exit gate
- [ ] A clean macOS user account installs from each storefront and reaches today's count in under 2 minutes.
- [ ] Privacy policy URL matches the live data flow.
- [ ] All storefront listings show: app icon, ≥3 screenshots per device class, version ≥1.0.0, support email, privacy policy URL.
- [ ] A friend on TestFlight installs, completes OAuth, and the widget refreshes within 30 minutes.
- [ ] Daily note logs version + storefront approval timestamps.

---

## 📋 Phase 6 — Telemetry + support

> **Architecture:** [[wiki/entities/Telemetry-And-Support]]. **Estimate:** 8–12h + ongoing weekly triage.

### 6.1 — Crash + error reporting
- [ ] Sentry browser SDK in the Chrome extension; PII scrubber drops `ghp_…`, `gho_…`, `eyJ…`. **Verify:** trigger a deliberate JS error → appears in Sentry within 30s, scrubbed.
- [ ] Sentry Cocoa in iOS + macOS host apps; user-context populator disabled. **Verify:** force a fatal in debug → Sentry receives the crash, no device identifier attached.
- [ ] Worker `console.error` → Logpush → R2 bucket, 30-day retention. **Verify:** trigger a 500 → R2 has the line within 30s.

### 6.2 — Heartbeat + opt-in
- [ ] `/heartbeat` route on the Worker; daily KV counter; immediately discard the body. **Verify:** `wrangler tail` shows the route hit; KV value increments.
- [ ] First-run Options checkbox "Send anonymous heartbeat" (default on). **Verify:** unchecking persists across reload; no further heartbeat fires.
- [ ] Mirror on Apple host apps' Settings tab. **Verify:** off-state respected on widget rebuilds (the host app, not the widget, sends).

### 6.3 — Feedback channels
- [ ] `.github/ISSUE_TEMPLATE/bug-chrome.md`, `bug-apple.md`, `feature-request.md`. **Verify:** creating a new issue offers the templates.
- [ ] Popup footer "Report an issue" link prefills the bug template with version + surface + last-sync via URL params. **Verify:** clicked link opens GitHub Issues with fields populated.
- [ ] `support@<domain>` alias forwards to personal inbox; auto-reply links to issues. **Verify:** test email round-trip.
- [ ] In-app "Send feedback" item posting to `/feedback` (KV-stored). **Verify:** message arrives in KV; weekly review queue works.

### 6.4 — Status page
- [ ] `status.<domain>` polls `/health`, GitHub GraphQL, and cache-hit ratio every 60s. **Verify:** flip Worker off → page red within 60s.
- [ ] 30-day grid history. **Verify:** synthetic outage on day N still shows on day N+30.
- [ ] Incidents linked to dated entries in `wiki/incidents/<date>-<slug>.md` (new wiki section, lights up the first time something breaks).

### 6.5 — Triage rhythm
- [ ] Document the SLAs in [[wiki/entities/Telemetry-And-Support]] (4h critical, 24h high, weekly feedback, monthly retro). **Verify:** each rhythm has a calendar reminder set.
- [ ] Schedule the monthly retention sweep cron. **Verify:** `wrangler dev --cron "0 0 1 * *"` fires the sweep locally.

### 6.6 — Exit gate
- [ ] Sentry → Worker → R2 → status page all wired and live for 7 consecutive days without a manual restart.
- [ ] Privacy policy in [[wiki/entities/Distribution-And-Release]] now references each retention number from [[wiki/entities/Telemetry-And-Support]].
- [ ] At least one round of the weekly feedback triage executed; outcome documented in `wiki/daily/<that-monday>.md`.

---

## 🧹 Ambient housekeeping (anytime)

- [ ] Add component visual-regression tests (Playwright snapshots) — Phase 5.x, not before.
- [ ] Replace any remaining lorem-ipsum copy in storefront listings.
- [ ] Audit shared-ts and shared-swift for dead exports after Phase 4 lands (the Worker may obviate some local cache helpers).
- [ ] Migrate to Bun for tooling once it has stable Workers compatibility (currently Node 20 + pnpm — fine).
- [ ] Annual `JWT_SIGNING_KEY` rotation reminder.

---

## For a fresh agent picking this up

1. Read [`CLAUDE.md`](./CLAUDE.md) first (60 seconds).
2. Skim [`MEMORY.md`](./MEMORY.md) for decisions already made.
3. Open [`wiki/Home.md`](./wiki/Home.md) for the knowledge base entry points; the entity for the phase you're picking up has the architecture.
4. Come back here, find the unblocked task you can start, and confirm its **Verify:** line before writing code.
5. On finishing a meaningful unit of work: append to `wiki/daily/<today>.md` and file a new `wiki/decisions/` entry if a choice was made.
6. Commit with a conventional prefix; push.
