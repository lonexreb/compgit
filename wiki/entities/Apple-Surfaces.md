# Apple Surfaces

> Phase 2b — the iOS and macOS host apps plus their widget extensions. Both apps consume [[Swift-Core]] verbatim. The widget extensions never hit the network; they read from a shared App-Group container that the host app fills.

## What

Two Xcode projects, four targets:

| Project | Target | Bundle ID | Role |
|---|---|---|---|
| `apps/ios/Compgit.xcodeproj` | `CompgitApp` | `com.<you>.compgit` | iOS 17+ host app — PAT entry, manual refresh, last-synced timestamp. |
| `apps/ios/Compgit.xcodeproj` | `CompgitWidgetExtension` | `com.<you>.compgit.widget` | iOS Home Screen / Lock Screen widget. |
| `apps/macos/Compgit.xcodeproj` | `CompgitMacApp` | `com.<you>.compgit.mac` | macOS 14+ host app — same shape, plus a `MenuBarExtra` stub for Phase 5. |
| `apps/macos/Compgit.xcodeproj` | `CompgitMacWidgetExtension` | `com.<you>.compgit.mac.widget` | macOS desktop widget. |

Both projects depend on `packages/shared-swift` as a local SPM package (drag the folder into the Xcode navigator → "Add Local Package").

## Why two projects, not one

iOS and macOS Apple Developer entitlements diverge enough (BackgroundModes is iOS-only; `MenuBarExtra` is macOS-only) that a single multi-platform target ends up gated by `#if os(iOS)` everywhere. Two projects sharing one SPM package keeps each Xcode configuration honest and the shared logic pure. — see [[Swift-Core]] for the package they share.

## Entitlements (the half-day of clicking)

All four targets need:

1. **App Groups** — `group.<TEAMID>.compgit`. This is the `suiteName` `SharedStore` opens. Without it the widget gets an empty container.
2. **Keychain Sharing** — access group `$(AppIdentifierPrefix)compgit`. Lets the widget extension read the PAT the host app stored. Matches `KeychainPAT(accessGroup:)`.
3. **Background Modes → Background fetch** — iOS app target only. Required for `BGAppRefreshTask`.

Pick the Team ID *before* clicking — every entitlement, every group ID, and every bundle ID embeds it. Renaming after the fact is a cascade.

## Host app shape

```
apps/ios/CompgitApp/
├── CompgitApp.swift        @main, registers BGAppRefreshTask "com.<you>.compgit.refresh"
├── ContentView.swift       PAT entry, manual refresh, status line
├── RefreshScheduler.swift  fetch → SharedStore.write → WidgetCenter.reloadAllTimelines
├── KeychainBridge.swift    thin wrapper over KeychainPAT with the right accessGroup
└── Tokens.swift            colours / type sizes mirroring Chrome's tokens.css
```

Everything that talks to GitHub goes through `GitHubClient` from [[Swift-Core]]. Errors render via `CompgitError` cases — same surface as the Chrome `Options.tsx` `StateLine`.

## Widget shape

```
apps/ios/CompgitWidgetExtension/
├── CompgitWidget.swift          @main widget, supportedFamilies
├── Provider.swift               TimelineProvider — placeholder, snapshot, getTimeline
├── Entry.swift                  TimelineEntry — date + cached ContributionsCollection
└── Views/
    ├── SmallView.swift          systemSmall — today's count + 14-day sparkline
    ├── MediumView.swift         systemMedium (mac) — adds a 7-day mini-heatmap
    └── LockScreenViews.swift    accessoryCircular + accessoryRectangular (Phase 5)
```

Rules of the road:

- **Never network-fetch from the widget.** `getTimeline` reads from `SharedStore(suiteName:)` only. Stale cache > spinning widget.
- **Cap chart data to 14–50 points.** Widget process memory budget is ~30 MB and Swift Charts allocates per series.
- **Refresh policy** = `.atEnd` returning a 30-min entry. Combined with the host's `BGAppRefreshTask` (also 30 min), the widget shows fresh data within a clock hour without burning rate limit.
- **Interactive refresh** uses an `AppIntent` (iOS 17+). The intent calls the host app's URL scheme; the widget itself stays read-only.

## Refresh pipeline

```
BGAppRefreshTask (30 min)
   │
   ▼
GitHubClient.fetchContributionsCollection
   │
   ▼
SharedStore.write(contributions: …) under group.<TEAMID>.compgit
   │
   ▼
WidgetCenter.shared.reloadAllTimelines()
   │
   ▼
Widget Provider.getTimeline reads SharedStore → renders
```

This is the macOS/iOS counterpart to [[Background-Fetch-Loop]]. Same 30-min cadence cap, same TTL contract, same storage keys.

## Verification

Phase 2b is "done" when:

- Build to a real iPhone, add the widget to Home Screen → today's count matches the Chrome extension and `github.com/<you>`.
- Build to Mac, add the desktop widget → same number, same heatmap.
- Toggle airplane mode on either device → widget renders cached data, no spinner, no crash.
- Instruments shows the widget extension's resident memory < 30 MB.
- Quit the host app → widget keeps refreshing for at least one cycle (proves App Group + Keychain reads work without the host process).

## Ambient improvements (post-2b, pre-Phase 5)

- Replace the Xcode-wizard project with an **XcodeGen `project.yml`** so the project file is reviewable in PRs.
- Add a Swift Testing target back into `packages/shared-swift` once Xcode is installed — see [[../decisions/2026-04-21-removed-swift-tests]].
- Wire Sentry-or-equivalent into both host apps for crash visibility — see [[Telemetry-And-Support]].

## Related

- [[Swift-Core]] — the SPM package both apps depend on.
- [[Background-Fetch-Loop]] — the Chrome counterpart of the refresh pipeline.
- [[../decisions/2026-04-21-removed-swift-tests]]
- [[Distribution-And-Release]] — TestFlight + notarization gates.
- [[Telemetry-And-Support]] — crash reporting and feedback.

## Sources

- `packages/shared-swift/Sources/CompgitCore/`
- Apple WidgetKit docs: <https://developer.apple.com/documentation/widgetkit>
- BGAppRefreshTask docs: <https://developer.apple.com/documentation/backgroundtasks/bgapprefreshtask>
- App Group container path: `URL(forUbiquityContainerIdentifier:)` is **iCloud**; for App Groups use `URL(forUbiquityContainerIdentifier:)`'s sibling `containerURL(forSecurityApplicationGroupIdentifier:)`.
