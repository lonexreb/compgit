# 2026-04-29 — Expand the plan end-to-end (Phase 2b through Phase 6)

## Decision

Document every remaining phase as an entity page with explicit acceptance criteria, then rewrite `NEXT-TO-DO.md` so an agent (human or LLM) can pick a task from any phase and have a verification gate, prerequisite list, and exit condition without re-reading the codebase. Add a Phase 6 (telemetry + support) that the original plan elided — shipping is not the same as supporting.

The plan now spans:

- **Phase 0** ✅ monorepo + schema codegen — already verified.
- **Phase 1** ✅ Chrome extension MVP — already verified.
- **Phase 2a** ✅ Swift core — already verified.
- **Phase 2b** 🟡 [[../entities/Apple-Surfaces]] — iOS + macOS host apps + widget extensions, blocked on Xcode.
- **Phase 3** 📋 [[../entities/Compare-Surface]] — follow developers and compare across surfaces.
- **Phase 4** 📋 [[../entities/OAuth-Worker]] — Cloudflare Worker brokers OAuth, KV-cached GraphQL, follow-list persistence.
- **Phase 5** 📋 [[../entities/Distribution-And-Release]] — six storefronts plus notarized direct download, with privacy policy and screenshot matrix.
- **Phase 6** 📋 [[../entities/Telemetry-And-Support]] — post-launch loop: crash reports, opt-in heartbeat, status page, support triage rhythm.

## Alternatives considered

- **Leave the plan terse.** The original `NEXT-TO-DO.md` was readable in 60 seconds and served Phases 1–2 well. But the gap from "Phase 4 — Cloudflare Worker + OAuth" to actually building it included an OAuth + PKCE flow, KV layout, session model, two-surface migration, and rate-limit math — none of which were in the doc. Future-me would have re-derived all of it.
- **Expand only Phase 2b** (the immediate next phase). Tempting, but Phase 2b's verification depends on knowing what Phase 4 will need (e.g., does the Swift `GitHubClient` need a configurable base URL? — yes, see [[../entities/OAuth-Worker]]). Underspecifying later phases forces rework in earlier ones.
- **Push expansion into a single long doc.** Rejected — atomic entity pages are how the rest of the wiki works (see [[README|decisions/README]]). One concept per file, heavy backlinks.

## Why this version

- **Each entity page has a Verification section.** "Phase N is done when…" with concrete checks. Mirrors the per-phase verification in [[../entities/compgit]].
- **Storage keys are now contracts across all surfaces.** `follows` and `compare:<login>` join the existing `auth.token`, `me.login`, `contributions:<login>`, `last-sync`. Documenting them now prevents Apple-side drift in Phase 3.
- **Phase 6 is real work.** Sentry wiring, status page, retention policies, and a triage rhythm are not "polish" — they're the difference between a project users keep using and one that silently breaks.

## Conditions to revisit

- **If Cloudflare Workers' free tier changes** — the entire OAuth-Worker design assumes generous KV reads + a cheap edge runtime. If pricing flips, reconsider Hono-on-Bun or Hono-on-Deno-Deploy.
- **If GitHub releases an official cross-platform contributions widget** — kills the product's reason to exist; the plan compresses to "ship the comparison angle only".
- **If Apple drops the $99/yr requirement for personal apps** — the App Store path becomes more attractive; widgets-via-TestFlight stop being a niche distribution.
- **If a contributor wants to take Phase 4 or 5 solo** — split the OAuth-Worker entity into a deeper RFC; current depth is "agent-resumable", not "RFC-quality".

## Related

- [[../entities/Apple-Surfaces]]
- [[../entities/Compare-Surface]]
- [[../entities/OAuth-Worker]]
- [[../entities/Distribution-And-Release]]
- [[../entities/Telemetry-And-Support]]
- [[daily/2026-04-29]]
