# OAuth Worker

> Phase 4 — `apps/worker`. A Cloudflare Worker (Hono) that brokers GitHub OAuth, fronts the GraphQL API with a KV read-through cache, and persists the follow list. Replaces the PAT-paste flow with one-click sign-in while keeping PAT mode behind an "Advanced" toggle.

## What

| Route | Method | Purpose |
|---|---|---|
| `/auth/start` | GET | Begin PKCE flow → 302 to `github.com/login/oauth/authorize`. |
| `/auth/callback` | GET | Exchange code → mint session JWT → set `compgit_session` cookie / return token to native client. |
| `/auth/logout` | POST | Revoke session, clear KV row. |
| `/me` | GET | Return viewer login from session. |
| `/contributions` | GET | KV cache, 1h TTL, falls back to GitHub GraphQL. |
| `/contributions/:login` | GET | Same, for followed developers. |
| `/follows` | GET / PUT | CRUD for `FollowList` (see [[Compare-Surface]]). |
| `/health` | GET | Liveness + KV reachability for uptime checks. |

## Why a Worker, not a server

- **Free tier covers a hobbyist easily** — 100k requests/day, KV reads/writes generous. No bill until we have real users.
- **Edge cache + KV** = single GitHub GraphQL call serves N readers globally.
- **No long-lived connections, no DB, no migration.** A Worker matches compgit's "small + opinionated" disposition. — see [[compgit]].

## Stack

- **Hono** — tiny router, ergonomic on Workers, Zod-friendly.
- **Wrangler** — local dev (`wrangler dev`), secret management, KV namespace bindings.
- **KV namespaces** — `CACHE` (TTL'd JSON blobs), `USERS` (session + follows).
- **Secrets** — `GH_CLIENT_ID` (env), `GH_CLIENT_SECRET` (`wrangler secret put`), `JWT_SIGNING_KEY` (rotated yearly).

## OAuth + PKCE flow

```
Client                Worker                       GitHub
  │ open /auth/start    │                            │
  │ ────────────────►   │                            │
  │                     │ generate code_verifier     │
  │                     │ store in KV (10-min TTL)   │
  │ 302 to GH authorize │                            │
  │ ◄────────────────   │                            │
  │   user signs in & approves                       │
  │ 302 /auth/callback?code=…                        │
  │ ────────────────►   │                            │
  │                     │ POST oauth/access_token    │
  │                     │ ──────────────────────────►│
  │                     │ ◄──────────────────────────│
  │                     │ verify PKCE + scopes       │
  │                     │ store access_token in KV   │
  │                     │ mint session JWT (24h)     │
  │ Set-Cookie compgit_session                       │
  │ ◄────────────────   │                            │
```

PKCE is required even on the server side — protects against code interception during the redirect. Spec: <https://datatracker.ietf.org/doc/html/rfc7636>.

## Session model

- **Cookie** for the Chrome extension (`Secure; HttpOnly; SameSite=Lax; Domain=compgit.<domain>; Path=/`).
- **Bearer token** for the iOS / macOS apps — surfaced as a body field, stored in Keychain via `KeychainPAT(accessGroup:)` (the same code path; the value just isn't a PAT anymore).
- JWT payload: `{ sub: <login>, sid: <random>, exp }`. The `sid` is the KV key for the GitHub access token. We never put the GitHub token in the JWT.

## KV layout

```
CACHE
  contributions:<login>   → { data: ContributionsCollection, fetchedAt }   TTL 3600s
  viewer:<sid>            → { login, fetchedAt }                            TTL 600s

USERS
  session:<sid>           → { login, gh_access_token, scopes, exp }
  follows:<login>         → FollowList                                      (no TTL)
```

`session:<sid>` is the only place a GitHub access token exists. If the JWT is leaked, rotating `JWT_SIGNING_KEY` invalidates every session without touching tokens.

## Migration paths

### Chrome extension

1. Replace the PAT input on Options with two affordances: **"Sign in with GitHub"** (primary) + **"Use a token instead"** (advanced).
2. The button calls `chrome.identity.launchWebAuthFlow({ url: '<worker>/auth/start', interactive: true })`.
3. On callback, parse the bearer token from the redirect URL fragment, write to `chrome.storage.local` under `auth.token` (same key — Phase 1 invariant holds).
4. Background worker calls `<worker>/contributions` instead of GitHub GraphQL when in OAuth mode. Detect mode via the presence of a `mode` field in storage.

### Apple apps

1. `ASWebAuthenticationSession(url: workerStartURL, callbackURLScheme: "compgit")`.
2. On completion, store the bearer in Keychain via `KeychainPAT`.
3. `GitHubClient` gets a `baseURL` parameter — defaults to `https://api.github.com/graphql`, switches to `<worker>/contributions` when in OAuth mode.

PAT mode stays available behind a toggle for the "I want zero backend dependency" crowd.

## Rate limit & cache invariants

- Cache hit ratio target: **> 80%** at steady state (one fetch per follower per hour, regardless of viewer count).
- Hard floor on GitHub calls: 1/login/hour. Anything below means the cache write isn't happening — alert.
- `/contributions` returns `Cache-Control: private, max-age=300` so the extension's local cache (see [[Background-Fetch-Loop]]) still does its 5-min TTL on top.

## Observability

- `console.log` lines in Workers go to `wrangler tail` and are forwarded to Logpush. — see [[Telemetry-And-Support]].
- Each route emits one structured log line: `{ route, status, ms, viewer, cacheHit }`.
- A daily cron Worker resets a rolling counter and posts a digest to a webhook (Discord/Slack of choice).

## Verification

Phase 4 is "done" when:

- `wrangler dev` boots; `/health` returns 200 with `kv: ok`.
- Sign-in round-trip works from the Chrome extension end-to-end; `chrome.storage.local` shows the new bearer token; popup still renders today's count.
- Sign-in works from the iOS host app; widget refreshes within one cycle using the bearer.
- KV inspector shows `contributions:<login>` populated with valid TTL.
- Pulling the network mid-flow returns cached data with the correct `fetchedAt`.
- Rotating `JWT_SIGNING_KEY` invalidates all sessions without touching `USERS:session:*` GitHub tokens.

## Related

- [[compgit]] — Phase 4 in the roadmap.
- [[../decisions/2026-04-20-pat-first-auth]] — why we waited.
- [[Compare-Surface]] — `/follows` is its persistence layer.
- [[Telemetry-And-Support]] — log shape and uptime.
- [[Distribution-And-Release]] — privacy policy hosting lives here.

## Sources

- Hono on Workers: <https://hono.dev/docs/getting-started/cloudflare-workers>
- KV: <https://developers.cloudflare.com/kv/>
- GitHub OAuth + PKCE: <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps>
- ASWebAuthenticationSession: <https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession>
