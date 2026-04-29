# compgit

> A cross-platform GitHub commit tracker. Three surfaces (Chrome extension, iPhone widget, macOS widget) share one data model. Ships today's commit count, year heatmap, multi-period trends, and a comparison tab against developers you follow.

## What

Compgit turns your contribution graph into ambient information. Open your browser — see today. Glance at your phone — see today. Look at your desktop — see today. And compare your cadence against people you follow, without opening GitHub.

It is deliberately small and opinionated:

- **PAT-first** in v1. You paste a fine-grained GitHub PAT and compgit never leaves your device. OAuth + a hosted backend arrive in Phase 4 once the product earns them. — [[../decisions/2026-04-20-pat-first-auth]]
- **Three native surfaces**, not one Electron app. Chrome extension via [[WXT]]; iPhone + macOS widgets via WidgetKit.
- **One schema.** A single `compgit.schema.json` drives both TypeScript and Swift models so the two platforms can never drift. — [[Schema-As-Source-Of-Truth]]
- **Hand-rolled charts.** SVG sparkline, SVG heatmap, SVG trend chart. No uPlot, no Cal-Heatmap. Keeps the bundle tiny and the design coherent. — [[../decisions/2026-04-20-no-cal-heatmap]]

## Three surfaces

| Surface | Popup-equivalent | Deep view |
|---|---|---|
| Chrome extension | Browser-action popup | Side panel (Today / Heatmap / Trends) |
| iPhone | Home Screen + Lock Screen widget | In-app view |
| macOS | Desktop widget + menu-bar | In-app view |

The Chrome extension shipped in Phase 1. The shared Swift core shipped in Phase 2a. The Apple surfaces (host apps + widget extensions) arrive in Phase 2b — see [[Apple-Surfaces]].

## How data flows

1. User pastes a fine-grained PAT in the Options page.
2. [[Shared-TypeScript-Core]]'s `fetchViewerLogin` validates it and returns their login.
3. Token + login are written to `chrome.storage.local`; a `token-changed` message nudges the background worker.
4. [[Background-Fetch-Loop]] fetches 365 days of `user.contributionsCollection` via the [[GitHub-GraphQL-API]] and stores the result under `contributions:<login>`.
5. The popup and side panel subscribe to that key via `useStorageValue` and re-render on change.
6. `chrome.alarms` re-fires the fetch every 15 minutes.

No backend in v1. All three surfaces will read-through the same shared container once Apple ships in Phase 2b. Phase 4 ([[OAuth-Worker]]) replaces the PAT paste with a Cloudflare Worker brokering OAuth and KV-cached GraphQL — PAT mode stays available behind an Advanced toggle.

## Phased roadmap

See the master list in [[../Home#Roadmap]]. Verification per phase:

- **Phase 0** — `pnpm install && pnpm gen:schema && pnpm typecheck && pnpm test && pnpm lint` all green; schema drift gate passes.
- **Phase 1** — Chrome extension loaded unpacked; PAT paste shows real today count matching `github.com/<you>`; airplane mode renders cached data; storage inspector shows `contributions:<login>` with valid shape.
- **Phase 2a** — `swift build` clean on Command Line Tools; `GitHubClient`, `SharedStore`, `KeychainPAT`, `Aggregate`, `Time`, `Errors`, and `Tokens` all surface from `CompgitCore`.
- **Phase 2b** — iOS + macOS widgets render the same today count on a real device. Full checklist on [[Apple-Surfaces]].
- **Phase 3** — comparison bar chart shows three other developers' counts matching their public profile graphs. See [[Compare-Surface]].
- **Phase 4** — OAuth round-trip completes from each surface; `wrangler dev` shows KV cache hits. See [[OAuth-Worker]].
- **Phase 5** — hour-of-day radial chart renders; Lock Screen widget appears; Chrome Web Store accepts submission. See [[Distribution-And-Release]].
- **Phase 6** — Sentry → Worker → R2 → status page wired and live for 7 consecutive days; opt-in heartbeat respected; first weekly feedback triage executed. See [[Telemetry-And-Support]].

## Related

- [[Schema-As-Source-Of-Truth]]
- [[Shared-TypeScript-Core]]
- [[Swift-Core]]
- [[Apple-Surfaces]]
- [[Compare-Surface]]
- [[OAuth-Worker]]
- [[Distribution-And-Release]]
- [[Telemetry-And-Support]]
- [[Background-Fetch-Loop]]
- [[Terminal-Editorial]]
- [[GitHub-GraphQL-API]]
- [[WXT]]

## Sources

- Plan file (local, not in repo): `~/.claude/plans/lets-make-a-project-elegant-muffin.md`
- GitHub GraphQL `contributionsCollection` docs: <https://docs.github.com/en/graphql/reference/objects#contributionscollection>
