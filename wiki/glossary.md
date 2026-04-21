# Glossary

Short definitions of compgit-specific and recurring terms. Link to the entity page when one exists.

- **Contribution calendar** — GitHub's 53×7 grid of daily commit counts, surfaced via `user.contributionsCollection.contributionCalendar`. See [[entities/GitHub-GraphQL-API]].
- **Contribution day** — one cell of the calendar: `{ date, contributionCount, contributionLevel }`.
- **Contribution level** — GitHub's 5-bucket intensity enum (`NONE` … `FOURTH_QUARTILE`).
- **Fine-grained PAT** — a GitHub Personal Access Token scoped to one user, one or more repos, and minimal permissions. compgit needs `read:user`.
- **MV3** — Chrome Extensions Manifest Version 3. Service worker instead of persistent background page; top-level event listeners only.
- **`me.login`** — storage key holding the authenticated user's GitHub login, inferred from `viewer { login }` on valid PAT.
- **`contributions:<login>`** — storage key under `chrome.storage.local` holding the latest `ContributionsCollection` for a login.
- **`last-sync`** — storage key holding `{ at, ok, message? }` for the most recent background refresh. See [[entities/Background-Fetch-Loop]].
- **Storage driver** — the small interface in `packages/shared-ts/src/storage.ts` that lets the same code run over `chrome.storage`, a memory map in tests, and Cloudflare KV in Phase 4.
- **Terminal Editorial** — compgit's visual direction. See [[entities/Terminal-Editorial]].
- **WXT** — the extension framework. See [[entities/WXT]].
- **Schema drift** — the situation where `generated.ts` or `Generated.swift` diverges from `compgit.schema.json`. CI fails on drift.
