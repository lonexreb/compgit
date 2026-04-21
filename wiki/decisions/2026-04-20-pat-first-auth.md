# 2026-04-20 — PAT-first auth in v1

## Decision

Ship with user-pasted fine-grained Personal Access Token. No OAuth, no backend. OAuth moves to Phase 4.

## Alternatives considered

- **OAuth from day one, via `chrome.identity.launchWebAuthFlow` + a Cloudflare Worker to hold the client secret.** Better UX (click-sign-in instead of paste-token) but requires a deployed Worker, an OAuth app registration, a privacy policy, and a domain — all on day one, for no additional user feature.
- **GitHub device flow.** Possible without a backend but the UX is "open this URL, type this code" — worse than paste for a one-time setup.

## Why PAT

- Zero infrastructure, zero operational risk.
- User's token stays on their device (`chrome.storage.local`), never traverses a server we operate.
- "Paste a token once" is a well-understood dev flow.
- We can ship and validate the product without paying for hosting or writing a privacy policy.

## When we revisit

Phase 4 adds a Cloudflare Worker (OAuth + shared cache + cross-device sync for followed-developer list). PAT mode stays behind an "Advanced" toggle for power users and CI.

## Related

- [[../entities/Shared-TypeScript-Core]]
- [[../entities/GitHub-GraphQL-API]]
