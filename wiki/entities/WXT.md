# WXT

> The framework that builds the Chrome extension. Compiles one codebase to Chrome, Edge, Brave, Arc, and Firefox. Chosen over hand-rolling a Vite + manifest setup because it handles MV3 lifecycle, entrypoint conventions, and cross-browser builds.

## What

`wxt` + `@wxt-dev/module-react` wrap Vite 6 with extension-aware config:

- **Entrypoint convention.** Files under `apps/chrome/entrypoints/` become the extension's views:
  - `background.ts` → service worker.
  - `popup/` → browser-action popup.
  - `sidepanel/` → side panel.
  - `options/` → options page.
- **Auto-imports.** `defineBackground` and friends are globally available after `wxt prepare`.
- **Manifest generation.** The manifest is derived from `wxt.config.ts` + entrypoint files — no hand-edited JSON.
- **Multi-browser builds.** `wxt build --browser firefox` emits a Firefox-compatible manifest without code changes.

## Why WXT and not plain Vite

- MV3 service worker lifecycle is fiddly; WXT has it right.
- Cross-browser is ~free with WXT, days of work without.
- Dev mode auto-reloads the extension on file changes.

## Why not Plasmo

- WXT's docs are cleaner as of 2026-04.
- Plasmo has React-centric magic we don't need.
- Both would have worked.

## Known gotchas

- **Vite version lockstep.** Tailwind v4 requires Vite 6, which requires WXT ≥ 0.20. Older WXT pins pull Vite 5 and break `@vitejs/plugin-react@6`. Keep the trio current.
- **`wxt prepare` runs in postinstall.** If you delete `apps/chrome/.wxt/` manually, `pnpm install` will recreate it; in CI, run `wxt prepare` before `tsc`.
- **Safari has no `chrome.sidePanel`.** The side panel entrypoint will fail to mount in Safari; degrade to popup-only there (Phase 5 concern).

## Related

- [[Terminal-Editorial]] — styling layer that sits on top of WXT's Vite config
- [[Background-Fetch-Loop]] — consumes WXT's `defineBackground`

## Sources

- <https://wxt.dev>
- `apps/chrome/wxt.config.ts`
