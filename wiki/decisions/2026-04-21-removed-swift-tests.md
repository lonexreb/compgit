# 2026-04-21 — Removed Swift test target in Phase 0

## Decision

`packages/shared-swift/Package.swift` has no `testTarget`. The Swift package builds on Command Line Tools alone; tests return in Phase 2 when full Xcode is installed.

## Alternatives considered

- **Keep XCTest target** → fails `swift test` locally (CLI Tools only) but passes in CI on macos-14 (Xcode).
- **Use Swift Testing** (`import Testing`, Swift 6.2+) → the rule we normally follow. Not available without Xcode.

## Why drop

- Phase 0's Swift surface is literally four generated structs and one `CompgitCore.version` constant. There's nothing worth testing until Phase 2 lands real APIs (`GitHubClient`, `SharedStore`, `KeychainPAT`).
- Keeping a test target that fails on the primary dev machine creates friction without value.
- When Xcode gets installed for Phase 2, we'll add a proper `testTarget` using Swift Testing (per the global rule).

## Related

- [[../entities/Schema-As-Source-Of-Truth]]
- [[daily/2026-04-21]]
