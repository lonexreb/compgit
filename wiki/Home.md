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
- [[entities/Background-Fetch-Loop]] — the 15-min alarm + refresh pipeline
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

## Daily

- [[daily/2026-04-20]] — Phase 0 complete
- [[daily/2026-04-21]] — Phase 1 complete

## Glossary

See [[glossary]] for short definitions of recurring terms.

## Roadmap

| Phase | What | Status |
|---|---|---|
| 0 | Monorepo, schema-as-source-of-truth, TS + Swift codegen, CI | ✅ 2026-04-20 |
| 1 | Chrome extension MVP — popup, side panel, options, background refresh | ✅ 2026-04-21 |
| 2 | iPhone + macOS widgets | next |
| 3 | Follow devs and compare | planned |
| 4 | Cloudflare Worker + OAuth | planned |
| 5 | Hour-of-day trends, Lock Screen, macOS menu bar, store releases | planned |

Per-phase verification steps live on the relevant [[entities/compgit]] section.

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
