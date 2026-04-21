# Swift Core

> `packages/shared-swift/Sources/CompgitCore` — the Swift mirror of [[Shared-TypeScript-Core]]. Same storage keys, same GraphQL query, same aggregation semantics. Builds with `swift build` on iOS 17+ / macOS 14+ or Command Line Tools.

## What

| File | Purpose |
|---|---|
| `GitHubClient.swift` | `actor GitHubClient` with `fetchContributionsCollection` and `fetchViewerLogin`. URLSession + JSONDecoder + typed errors. |
| `SharedStore.swift` | `UserDefaults(suiteName:)` wrapper keyed on the same strings as the Chrome extension — `auth.token`, `me.login`, `contributions:<login>`, `last-sync`. |
| `KeychainPAT.swift` | Keychain Services (`SecItemAdd/Update/CopyMatching/Delete`) for the GitHub PAT. Accepts an `accessGroup` so the widget extension can read what the host app wrote. |
| `Aggregate.swift` | `CompgitAggregate` enum namespace with `totalInWindow`, `sparklineSeries`, `streak`, `byWeek/Month/Year`. Pure, platform-free. |
| `Time.swift` | `CompgitTime` namespace — `todayISODate`, `daysAgoISODate`, `rangeDates`, `isoWeekKey`, `monthKey`, `yearKey`. |
| `Errors.swift` | `CompgitError` enum: `auth`, `rateLimited(resetAt)`, `network`, `validation`, `notAuthenticated`. Mirrors the TS error hierarchy. |
| `CompgitCore.swift` | Version namespace + file index. |

## Why mirror TS instead of sharing

Swift can't consume TypeScript modules, and the ergonomic gap between Swift `actor` / `Sendable` and JS's fetch is real. The mirror keeps APIs visibly parallel — a fix on one side is easy to port — without forcing a lowest-common-denominator.

## Storage contract

Written by the host app, read by the widget extension. Identical keys to the Chrome extension so the cross-platform cache invariants stay the same.

```
auth.token            -> String (mirrored into Keychain for widget access)
me.login              -> String
contributions:<login> -> ContributionsCollection (JSON-encoded Data)
last-sync             -> { at, ok, message? } (JSON-encoded Data)
```

Widgets should:

1. Construct `SharedStore(suiteName: "group.TEAMID.compgit")`.
2. Read `meLogin` and `contributions(for: login)` inside `TimelineProvider.getTimeline`.
3. Render from that data; never hit the network directly.

## Gotchas

- **App Group on macOS requires the Team ID prefix.** `group.TEAMID.compgit`, not `group.compgit`. This is new in Sequoia.
- **Keychain accessGroup** must match exactly between host app and widget extension (`$(AppIdentifierPrefix)compgit`).
- **Swift 6 actor isolation**: `GitHubClient` is an actor, so calls to it from SwiftUI must `await`. Use `Task { ... }` in `TimelineProvider` methods.
- **`ContributionsCollection` is generated from JSON Schema** — it's a `struct` with a memberwise init; fields are alphabetised. Don't reach for reordering.

## Related

- [[Shared-TypeScript-Core]] — the reference implementation.
- [[Schema-As-Source-Of-Truth]] — how the Swift structs get generated.
- [[Background-Fetch-Loop]] — its macOS/iOS counterpart lives in the host app via `BGAppRefreshTask`.

## Sources

- `packages/shared-swift/Sources/CompgitCore/`
- `swift build` output on macOS (tested on Command Line Tools 16).
