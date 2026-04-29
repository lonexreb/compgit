# Shared TypeScript Core

> `packages/shared-ts` — the runtime-agnostic heart of compgit. GitHub client, cache, storage abstraction, auth, time helpers, aggregation. Runs in the Chrome extension today and will run inside the Cloudflare Worker in Phase 4 unchanged.

## What

| Module | Purpose |
|---|---|
| `github/graphql.ts` | `fetchContributionsCollection`, `fetchViewerLogin`. Zod-validated, typed errors (`AuthError`, `RateLimitError`, `NetworkError`, `ValidationError`). Both functions accept an optional `baseURL` so Phase 4 can flip them to the Worker without rewriting call sites. |
| `github/errors.ts` | The error hierarchy. Opaque; consumers pattern-match via `instanceof`. |
| `storage.ts` | `StorageDriver` interface plus an in-memory driver for tests. Chrome- and KV-specific drivers live in their respective packages. |
| `cache.ts` | Generic `Cache<T>` over a `StorageDriver` with TTL and `readFresh` / `readStale` / `subscribe`. |
| `auth.ts` | Session-first token load that primes from local on cold read; `me.login` round-trip. |
| `aggregate.ts` | Pure functions over `ContributionDay[]`: `totalInWindow`, `sparklineSeries`, `streak`, `byWeek`, `byMonth`, `byYear`. |
| `time.ts` | Calendar-date helpers, timezone-safe; `todayISODate`, `daysAgoISODate`, `rangeDates`, ISO week / month / year keys. |

## Why runtime-agnostic

If the module closed over `chrome.*` directly, it would become impossible to run in the Cloudflare Worker (Phase 4) or in Node tests (today). The `StorageDriver` interface lets any container provide storage; `FetchLike` lets any container provide network I/O.

## Testing

Vitest, colocated `*.test.ts`. Coverage gate 80% lines / 75% branches via `vitest.config.ts`. Today: 43 tests, ~97% lines across covered modules.

The GraphQL client's tests mock a `FetchLike` that returns hand-built `Response` objects — no real network.

## Related

- [[Background-Fetch-Loop]] — what `shared-ts` enables on the Chrome side
- [[GitHub-GraphQL-API]] — the one external contract this module cares about
- [[Schema-As-Source-Of-Truth]] — where `ContributionsCollection` comes from
- [[OAuth-Worker]] — Phase 4 home of `shared-ts` running on Cloudflare Workers; `baseURL` is the seam
- [[Compare-Surface]] — Phase 3 aggregator that lives in this package

## Sources

- `packages/shared-ts/package.json`
- Zod: <https://zod.dev>
- Vitest: <https://vitest.dev>
