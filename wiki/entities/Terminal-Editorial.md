# Terminal Editorial

> compgit's visual direction. Dark by default, monospace body, serif display numerals, one accent colour used sparingly. No shadows, no gradients — hierarchy from scale contrast.

## What

**Typography**

- Display: Fraunces Variable (serif, used for hero numerals and H1).
- Body: JetBrains Mono Variable (used everywhere else).
- Self-hosted via `@fontsource-variable/*` so the extension never hits a CDN.

**Palette (dark default)**

- `--color-bg`: `oklch(17% 0 0)` — near-black, slightly warm
- `--color-surface`: `oklch(22% 0 0)`
- `--color-text`: `oklch(92% 0 0)`
- `--color-text-muted`: `oklch(62% 0 0)`
- `--color-text-faint`: `oklch(42% 0 0)`
- `--color-accent`: `oklch(72% 0.19 142)` — GitHub-green-ish, used *once* per view
- `--color-danger`: `oklch(65% 0.22 25)`

Full light-mode palette defined under `@media (prefers-color-scheme: light)`.

**Tokens live in CSS, not Tailwind config.**

- `apps/chrome/styles/tokens.css` is the source of truth.
- `apps/chrome/styles/global.css` imports tokens and maps them to Tailwind v4 via `@theme { ... }`.
- Utility classes like `bg-bg`, `text-text-muted`, `font-display`, `text-display-md` all resolve to the tokens at build time.

## Rules

- **One accent per view.** If two things are accent-coloured, one of them is wrong.
- **No shadows.** Borders at 1px, radius ≤ 2px.
- **Negative space is a design element.** At least 1/3 of the popup is whitespace.
- **Motion is rare.** Only tab underline slide and the occasional trailing-dot on charts. Reduced-motion opts out.
- **Hierarchy from scale.** Hero is 64–90pt Fraunces. Body is 13pt mono. Don't reach for a new font weight or colour to make something stand out.

## Why

A commit tracker for developers should feel like a terminal someone cared about, not a SaaS dashboard. The serif numerals ([Fraunces](https://fonts.google.com/specimen/Fraunces)) give each "today" moment weight; the monospace body ([JetBrains Mono](https://www.jetbrains.com/lp/mono/)) anchors the rest. Sticking to one accent prevents the "Christmas lights" failure mode of charts trying to mean too much.

## Anti-patterns explicitly banned

- Default Tailwind card grids with uniform spacing.
- Gradient blobs behind hero text.
- Drop shadows anywhere.
- More than two type families.
- Accent used decoratively (e.g., hover highlight on an irrelevant element).

These come from the `web/design-quality.md` global rule but also from the research we did up front.

## Related

- [[compgit]]
- [[WXT]] — how the tokens are delivered to the popup/side panel

## Sources

- `apps/chrome/styles/tokens.css`
- `apps/chrome/styles/global.css`
- Fraunces: <https://fonts.google.com/specimen/Fraunces>
- JetBrains Mono: <https://www.jetbrains.com/lp/mono/>
