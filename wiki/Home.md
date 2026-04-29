# compgit wiki

> A compounding knowledge base for the project, in Karpathy-style. Atomic pages, heavy [[wikilinks]], decisions dated, daily notes short. Open this folder as an Obsidian vault for backlinks and graph view.

## Start here

- **Project**: [[entities/compgit]]
- **Agent runbook**: [../CLAUDE.md](../CLAUDE.md)
- **Compounding memory**: [../MEMORY.md](../MEMORY.md)
- **Phases + roadmap**: [[#Roadmap]] below

## Entities

Core concepts and modules.

- [[entities/compgit]] — the product and its three surfaces
- [[entities/Schema-As-Source-Of-Truth]] — one JSON Schema → TS + Swift
- [[entities/Shared-TypeScript-Core]] — `packages/shared-ts`
- [[entities/Swift-Core]] — `packages/shared-swift` (Phase 2a)
- [[entities/Apple-Surfaces]] — iOS + macOS apps + widgets (Phase 2b)
- [[entities/Background-Fetch-Loop]] — the 15-min alarm + refresh pipeline
- [[entities/Compare-Surface]] — follow + compare across surfaces (Phase 3)
- [[entities/OAuth-Worker]] — Cloudflare Worker, OAuth, KV cache (Phase 4)
- [[entities/Distribution-And-Release]] — store submissions + notarization (Phase 5)
- [[entities/Telemetry-And-Support]] — crash reports, status page, triage (Phase 6)
- [[entities/Terminal-Editorial]] — visual direction
- [[entities/GitHub-GraphQL-API]] — primary data source
- [[entities/WXT]] — the extension framework

## Decisions

Dated, with the alternatives considered. See [[decisions/README]].

- [[decisions/2026-04-20-pat-first-auth]]
- [[decisions/2026-04-20-merged-schema]]
- [[decisions/2026-04-20-hand-rolled-schemagen]]
- [[decisions/2026-04-20-no-cal-heatmap]]
- [[decisions/2026-04-21-removed-swift-tests]]
- [[decisions/2026-04-29-end-to-end-plan-expansion]]

## Daily

- [[daily/2026-04-20]] — Phase 0 complete
- [[daily/2026-04-21]] — Phase 1 complete + Phase 2a Swift core
- [[daily/2026-04-29]] — end-to-end plan expansion

## Glossary

See [[glossary]] for short definitions of recurring terms.

## Roadmap

| Phase | What | Status |
|---|---|---|
| 0 | Monorepo, schema-as-source-of-truth, TS + Swift codegen, CI | ✅ 2026-04-20 |
| 1 | Chrome extension MVP — popup, side panel, options, background refresh | ✅ 2026-04-21 |
| 2a | Swift core — `packages/shared-swift` actor + storage + keychain | ✅ 2026-04-21 |
| 2b | iOS + macOS host apps + widget extensions ([[entities/Apple-Surfaces]]) | 🟡 blocked on Xcode |
| 3 | Follow devs + compare across surfaces ([[entities/Compare-Surface]]) | 📋 planned |
| 4 | Cloudflare Worker + OAuth + KV cache ([[entities/OAuth-Worker]]) | 📋 planned |
| 5 | Store submissions, hour-of-day, Lock Screen, menu bar ([[entities/Distribution-And-Release]]) | 📋 planned |
| 6 | Crash reports, opt-in heartbeat, status page ([[entities/Telemetry-And-Support]]) | 📋 planned |

Per-phase verification lives in each entity page's "Verification" section. The end-to-end plan expansion that produced this layout is [[decisions/2026-04-29-end-to-end-plan-expansion]].

## How this wiki works

- **Atomic pages.** One concept per file. If a page grows past ~300 lines, split it.
- **Wikilinks over prose refs.** `[[entities/X]]` instead of "see X above". Obsidian renders them as graph edges.
- **Dated decisions.** A decision is a fork in the road. Name it, date it, link to alternatives.
- **Daily notes stay short.** 3–6 bullets is fine. Big things graduate into entity pages or decisions.
- **Never silently delete.** Deprecating a page is itself a note — link to what replaced it.

When adding a new concept, create `entities/<Name>.md` with this skeleton:

```md
# Name

> One-line definition.

## What

## Why / trade-offs

## How it works

## Related

- [[…]]

## Sources
```
