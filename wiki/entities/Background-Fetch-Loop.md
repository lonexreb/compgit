# Background Fetch Loop

> The Chrome MV3 service worker in `apps/chrome/entrypoints/background.ts`. Runs on a 15-minute alarm, fetches the user's contribution calendar, writes it to `chrome.storage.local`, and the UI re-renders via storage subscriptions.

## What

Three listeners, top-level, synchronous registration (MV3 requires this):

1. `chrome.runtime.onInstalled` — on fresh install, open the Options page and register the refresh alarm.
2. `chrome.runtime.onStartup` — ensure the alarm still exists when Chrome restarts.
3. `chrome.alarms.onAlarm` — when the `compgit-refresh` alarm fires, call `refreshContributions()`.
4. `chrome.runtime.onMessage` — handle `token-changed`, `refresh-now`, `clear-cache` from views; async handlers return `true` to keep the channel open.

## The refresh function

`refreshContributions()` lives in `apps/chrome/lib/refresh.ts` with dependency-injectable stores, `now`, and `fetchImpl` — so it can run in tests without chrome.*. It:

1. Loads token + `me.login`. If either is missing, returns `{ ok: false, reason: 'no auth' }` without touching the cache.
2. Computes a 365-day window ending at `now`.
3. Calls `fetchContributionsCollection` from [[Shared-TypeScript-Core]].
4. Writes the result to `chrome.storage.local` under `contributions:<login>`.
5. Writes a `last-sync` status entry (either `{ ok: true, at }` or `{ ok: false, at, message }`).
6. Returns a structured outcome.

On error, the stale cache is left intact — the UI keeps rendering old data and shows an "offline" badge.

## Storage contract

| Key | Shape | Written by | Read by |
|---|---|---|---|
| `auth.token` | `string` | Options on valid PAT | background, Options |
| `me.login` | `string` | Options on valid PAT | background, Popup, Side Panel |
| `contributions:<login>` | `ContributionsCollection` | background | Popup, Side Panel |
| `last-sync` | `{ at, ok, message? }` | background | Popup header (offline badge), Side Panel header |

These keys are a stable public contract — see [[../../CLAUDE]] section 4.

## Why this shape

- **Background owns the fetch.** The popup and side panel have fragile lifecycles (opened and closed rapidly). If they owned the fetch, we'd hammer GitHub. The background worker runs exactly one fetch per 15-min window.
- **UI is pure storage subscribers.** `useStorageValue` from `apps/chrome/hooks/` is the only way UI reads state. No `fetch` calls outside the background or Options-page PAT validation.
- **Message protocol is tiny.** Three types: `token-changed`, `refresh-now`, `clear-cache`. Each returns a `BackgroundAck`. Defined in `apps/chrome/lib/messages.ts`.

## Related

- [[Shared-TypeScript-Core]]
- [[WXT]]
- [[GitHub-GraphQL-API]]
- [[Apple-Surfaces]] — the Phase 2b mirror of this loop, driven by `BGAppRefreshTask` instead of `chrome.alarms`
- [[OAuth-Worker]] — Phase 4 swaps `fetchContributionsCollection` for a Worker-fronted call without changing this loop

## Sources

- MV3 service worker lifecycle: <https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle>
- `apps/chrome/entrypoints/background.ts`
- `apps/chrome/lib/refresh.ts`
