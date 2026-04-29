# Compare Surface

> Phase 3 — the "follow developers and compare" feature, shared across Chrome, iOS, and macOS. One pure aggregator (`compare.ts` / `Compare.swift`) plus surface-specific UIs (uPlot bar chart on the web, Swift Charts on Apple).

## What

A user picks up to ~20 GitHub logins they want to track alongside themselves. For each selected period (today / week / month / year), compgit fetches each follower's `contributionsCollection` and renders a sorted bar chart. The user's row is always pinned at the top.

Three views:

| Surface | Entry point | Rendering |
|---|---|---|
| Chrome | Side panel `Compare` tab | uPlot bar chart, click-to-pin row, period selector. |
| iOS host app | New `CompareView` tab | Swift Charts horizontal bar chart, swipe-to-remove rows. |
| macOS host app | Same as iOS, plus the `MenuBarExtra` mini list (Phase 5). |

Widgets get a "you vs. one rival" small variant in **Phase 5**, not Phase 3 — keeps Phase 3 tight.

## Data model

Persisted under the `follows` storage key (Chrome `chrome.storage.local`, Swift `SharedStore`):

```ts
type FollowList = {
  logins: string[];          // ordered as user added them, deduped
  updatedAt: string;         // ISO timestamp
};

type ComparisonRow = {
  login: string;
  totalToday: number;
  totalWeek: number;
  totalMonth: number;
  totalYear: number;
  fetchedAt: string;
  error?: 'not-found' | 'rate-limited' | 'network';
};
```

`ComparisonRow` is **per-login + period-derived**. The aggregator caches the `contributionsCollection` per login under `compare:<login>` with a 1-hour TTL so the chart can re-render across periods without re-fetching.

## Aggregation pipeline

`packages/shared-ts/src/compare.ts`:

```text
input:  FollowList + viewerLogin
output: ComparisonRow[]

1. for each login, in parallel with concurrency cap = 4
   1a. read compare:<login> from cache
   1b. if missing or stale → fetchContributionsCollection(login)
   1c. derive totals via Aggregate.totalInWindow for each period
2. annotate the viewer row with isViewer: true
3. sort: viewer pinned, rest descending by selected period
```

The cap of 4 is deliberate: GitHub GraphQL bills 1 point per `contributionsCollection`, default budget is 5000/hour. Twenty followers × refresh-on-period-change × four periods = a lot if we don't cap.

`packages/shared-swift/Sources/CompgitCore/Compare.swift` mirrors the same shape — `actor CompareAggregator` with the same cap, same cache key, same return type.

## Why parallel-with-cap, not Promise.all

20 simultaneous in-flight requests blow through the secondary rate limit (concurrent connections), and a single slow follower stalls the whole batch. A small worker pool (4) is fast in the common case (~1.2s for 20 logins) and degrades cleanly when one user is slow. — see [[GitHub-GraphQL-API]] for budget math.

## UI rules

- **One accent colour** for the viewer's bar; everything else is `text-text-muted`. Keeps the chart legible under [[Terminal-Editorial]].
- **Period selector** is `today / 7d / 30d / 365d` — the four `Aggregate` window types. Don't add custom ranges; that's a Phase 5+ feature.
- **Inline errors** render as a strikethrough row with a small badge (`401`, `429`, `net`). Don't drop a follower from the chart on transient failure — that produces flicker.
- **Empty state** when `follows.length === 0`: "Add a developer to compare" with a search input. Search hits `users(login:)` GraphQL, debounced 300 ms.

## Storage contract

The follow list is added to the cross-platform key set:

```
follows               -> { logins, updatedAt } (JSON)
compare:<login>       -> ContributionsCollection (JSON), 1h TTL via cache.ts
```

These keys are the same shape on Chrome (`chrome.storage.local`) and Apple (`SharedStore`). Don't introduce a `follows.v2` — extend the existing key.

## Migration / new-user path

- Existing users on a Phase 1 build read an empty `follows` key → Compare tab shows the empty state. No migration code needed.
- The compare.ts aggregator only reads cached `contributions:<login>` when the login matches the *viewer's* login; for everyone else it lives under `compare:<login>` to keep the two layers separate.

## Verification

Phase 3 is "done" when:

- Add `gaearon`, `sindresorhus`, and yourself → bar chart matches each user's public contribution graph for today, week, month, year.
- Remove a follower → row disappears, cache key is purged.
- Toggle off network → cached rows render with a "stale" badge and the timestamp from `fetchedAt`.
- Open the iOS app → same followers list, same totals (proves storage parity).
- Hit a rate limit (artificially set `Authorization` to a low-budget PAT) → rows render with `429` badge, no UI crash.

## Related

- [[GitHub-GraphQL-API]] — `contributionsCollection` is point-billed; cap matters.
- [[Shared-TypeScript-Core]] — where `compare.ts` lives.
- [[Swift-Core]] — where `Compare.swift` lives.
- [[Terminal-Editorial]] — chart styling rules.
- [[Apple-Surfaces]] — host apps that consume the Swift aggregator.

## Sources

- GitHub GraphQL rate limit: <https://docs.github.com/en/graphql/overview/resource-limitations>
- uPlot: <https://github.com/leeoniya/uPlot>
- Swift Charts: <https://developer.apple.com/documentation/charts>
