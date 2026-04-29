# Telemetry and Support

> Phase 6 — the post-launch loop. Privacy-respecting analytics, crash reporting, an issue triage rhythm, and a status page. Designed so the smallest signal triggers a fix on the surface that matters, without ever sending a user's PAT or contribution data anywhere.

## What

Three loops:

1. **Crash + error reporting** — surface failures fast; ship fixes daily.
2. **Usage signals** — a tiny, anonymous heartbeat that answers "is the extension still running?" and nothing else.
3. **User feedback** — GitHub Issues + a `support@<domain>` alias that routes to a personal inbox.

What we deliberately do **not** collect: contribution counts, repo names, follower lists, PATs, OAuth tokens, IP addresses (Workers strip them), session JWT bodies.

## Crash + error reporting

| Surface | Tool | What gets sent |
|---|---|---|
| Chrome extension | Sentry browser SDK | Stack traces, extension version, browser, error message. PII scrubber drops anything matching `ghp_…`, `gho_…`, `eyJ…`. |
| iOS / macOS apps | Sentry Cocoa | Stack, OS version, app version. No device identifiers. |
| Cloudflare Worker | `console.error` → Logpush → R2 bucket | One JSON line per error. 30-day retention, then deleted. |

Sampling: 100% of errors, 0% of normal events. We don't need performance traces yet.

## Usage signals (heartbeat only)

A nightly opt-in ping at install + once-per-day:

```json
{
  "v": "1.0.0",
  "surface": "chrome",
  "platform": "macOS",
  "installedAt": "2026-04-29",
  "authMode": "pat" | "oauth"
}
```

Ping target is `<worker>/heartbeat`. The Worker increments a daily KV counter and immediately discards the body. No `userAgent`, no IP, no session.

The first-run Options page shows a checkbox: "Send anonymous heartbeat (helps me know the extension still runs)". Default = on. One-click off, persisted in `chrome.storage.local` under `telemetry.optIn`. Same key on Apple via `SharedStore`.

## User feedback channels

- **GitHub Issues** — primary. Three issue templates: `bug-chrome.md`, `bug-apple.md`, `feature-request.md`. The Chrome popup's footer has a "Report an issue" link that prefills the bug template with version + surface + last-sync timestamp via URL params.
- **Support email** — `support@<domain>` forwards to the personal inbox. Auto-reply links to GitHub Issues for "tracking".
- **In-app feedback** (Phase 6.1) — a tiny "Send feedback" item in the side panel and the Apple host app. Posts a free-text note + version to `<worker>/feedback`. KV-stored, reviewed weekly.

## Status page

Public status page hosted on the Worker at `status.<domain>`. Three indicators:

| Indicator | Source | Healthy threshold |
|---|---|---|
| Worker | `/health` cron (every 60s) | 99.5% / 30 days |
| GitHub GraphQL | last 100 calls' status mix | < 1% non-200 |
| Cache hit ratio | Worker counters | > 80% |

History rendered as a 30-day grid. Incidents linked to dated entries in `wiki/incidents/<date>-<slug>.md` (a new wiki section that lights up the first time something breaks).

## Triage rhythm

- **Within 4h** of a Sentry CRITICAL: open or update a GitHub issue with the stack, set `severity:critical`, push a fix branch.
- **Within 24h** of any Sentry HIGH: triage to either a fix or a documented "known issue" in the next release notes.
- **Weekly** (Monday): empty the `<worker>/feedback` queue, file any actionable items as issues, archive the rest.
- **Monthly**: review status page incidents, write a brief retrospective note in `wiki/daily/<date>.md`.

## Data retention

| Source | Retention | Where |
|---|---|---|
| Sentry events | 90 days | Sentry SaaS (free tier) |
| Worker error logs | 30 days | R2 bucket, lifecycle-deleted |
| Heartbeat counters | 1 year | KV, daily aggregate only |
| Feedback notes | until acted-on, max 1 year | KV |

A scheduled Worker (`cron: "0 0 1 * *"`) sweeps anything past retention.

## Privacy posture

- The privacy policy ([[Distribution-And-Release]]) lists each item above by name.
- Heartbeat is a hashed install ID (`crypto.subtle.digest('SHA-256', random())` at install, stored locally) — used only for daily-active uniqueness; never reverse-resolvable.
- Sentry has the user-context populator disabled. We only set `release` and `environment`.
- Workers strip `cf-connecting-ip` before logging; Logpush is configured with the same redaction.

## Verification

Phase 6 is "done" when:

- Trigger a deliberate JS error in the extension → appears in Sentry within 30s, scrubbed of any token-shaped strings.
- Trigger a Worker 500 → appears in R2 within 30s.
- Status page renders all three indicators green; flip Worker off → indicator goes red within 60s.
- Hit "Report an issue" in the popup → opens GitHub Issues with the bug template prefilled.
- Toggle telemetry off → no further `/heartbeat` calls observed in `wrangler tail`.

## Related

- [[OAuth-Worker]] — host of `/heartbeat`, `/feedback`, `/health`, status page.
- [[Distribution-And-Release]] — privacy policy + support email setup.
- [[compgit]] — Phase 6 in the roadmap.

## Sources

- Sentry browser SDK: <https://docs.sentry.io/platforms/javascript/>
- Sentry Cocoa: <https://docs.sentry.io/platforms/apple/>
- Workers Logpush + R2: <https://developers.cloudflare.com/logs/get-started/enable-destinations/r2/>
- Plausible / privacy-first analytics primer: <https://plausible.io/data-policy> (referenced for the heartbeat philosophy, not the SDK).
