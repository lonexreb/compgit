<p align="center">
  <img src="./assets/banner.svg" alt="compgit — a quiet github commit tracker across chrome, iphone, and macos" width="100%" />
</p>

<p align="center">
  <em>GitHub commits, quietly visible — across a Chrome extension, an iPhone widget, and a macOS widget.</em>
</p>

<p align="center">
  <a href="#getting-started">Getting started</a> ·
  <a href="#what-ships-today">What ships today</a> ·
  <a href="#design">Design</a> ·
  <a href="./CLAUDE.md">CLAUDE.md</a> ·
  <a href="./wiki/Home.md">Wiki</a>
</p>

---

## Why

Most developers never look at their own contribution graph unless they're applying for a job. compgit makes today's ship count ambient — on the browser you're already in, the phone on your desk, and the desktop you're working from. Shipping becomes a thing you see, not a thing you check.

Three surfaces, one schema:

- **Chrome extension** (popup + side panel) — today, heatmap, 4-period trends.
- **iPhone widget** (Home Screen + Lock Screen) — today's count + 7-day sparkline. *(Phase 2)*
- **macOS widget** (desktop + menu bar) — same, ambient. *(Phase 2)*

And a comparison tab to see your pace against the devs you follow. *(Phase 3)*

## What ships today

| Phase | What | Status |
|---|---|---|
| 0 | Monorepo, schema-as-source-of-truth, TS + Swift codegen, CI | ✅ done |
| 1 | Chrome extension MVP — popup, side panel, options, background refresh | ✅ done |
| 2 | iPhone + macOS widgets | in progress |
| 3 | Follow devs and compare | planned |
| 4 | Cloudflare Worker + OAuth | planned |
| 5 | Hour-of-day trends, Lock Screen widget, macOS menu bar, store releases | planned |

## Getting started

```bash
git clone https://github.com/lonexreb/compgit
cd compgit
pnpm install
pnpm gen:schema        # emits TS + Swift models from packages/schema
pnpm typecheck
pnpm lint
pnpm test
```

### Run the Chrome extension

```bash
pnpm -F @compgit/chrome dev       # launches Chrome with the unpacked extension
```

1. On first install, the Options page opens automatically.
2. Paste a [fine-grained GitHub PAT](https://github.com/settings/personal-access-tokens/new) with `read:user` scope.
3. Click the compgit icon in the toolbar to see today's count; right-click the icon → "Open side panel" for the heatmap and trends.

### Build for production

```bash
pnpm -F @compgit/chrome build        # Chrome / Edge / Brave / Arc
pnpm -F @compgit/chrome build:firefox
```

Outputs land in `apps/chrome/.output/`. Popup and sidepanel bundles stay under 11 KB gzipped; total with self-hosted fonts is ~470 KB.

## Repo layout

```
compgit/
├── apps/
│   ├── chrome/          WXT extension (React + Tailwind v4)
│   ├── ios/             Xcode project                       (Phase 2)
│   ├── macos/           Xcode project                       (Phase 2)
│   └── worker/          Cloudflare Worker                   (Phase 4)
├── packages/
│   ├── schema/          compgit.schema.json — source of truth
│   ├── shared-ts/       GitHub client, cache, aggregation, Zod guards
│   └── shared-swift/    Swift package mirroring shared-ts   (Phase 2)
├── tools/
│   └── schemagen/       JSON Schema → TS + Swift emitter
├── wiki/                Obsidian vault — project knowledge base
│   ├── Home.md
│   ├── entities/        One file per concept (Karpathy wiki style)
│   ├── decisions/       Dated decisions log
│   └── daily/           Daily notes
├── CLAUDE.md            Agent runbook
├── MEMORY.md            Compounding project memory
└── README.md
```

## Design

compgit uses **Terminal Editorial** direction: dark by default, [Fraunces](https://fonts.google.com/specimen/Fraunces) for display numerals, [JetBrains Mono](https://www.jetbrains.com/lp/mono/) for body, one accent colour used sparingly. No shadows, no gradients — hierarchy from scale contrast.

All three surfaces share a single JSON Schema (`packages/schema/compgit.schema.json`) that codegens both the TypeScript and Swift types. A CI gate fails the build if the emitted files drift from the schema.

Read the full design + architecture notes in the [wiki](./wiki/Home.md).

## Development

Full phase plan, verification steps per phase, and architectural decisions live in the [wiki's decisions log](./wiki/decisions/).

- `pnpm test` — Vitest over the shared package (41 tests, ~97% coverage on pure modules).
- `pnpm typecheck` — tsc across all TS workspaces via Turborepo.
- `pnpm lint` / `pnpm format` — Biome.
- `pnpm check:schema-drift` — regenerates the model code and fails if it differs from what's committed.

## Licence

MIT.
