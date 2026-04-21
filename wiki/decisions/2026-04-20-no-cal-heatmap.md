# 2026-04-20 — Hand-rolled SVG charts (no uPlot, no Cal-Heatmap)

## Decision

All charts in the Chrome extension are hand-rolled SVG. `Sparkline`, `Heatmap`, `TrendChart` components total ~350 LoC across `apps/chrome/components/`. Zero chart dependencies.

## Alternatives considered

- **uPlot** (~10 KB gzipped) for sparkline and trend chart.
- **Cal-Heatmap** (~20 KB gzipped + transitive d3 deps) for the GitHub-style contribution grid.

## Why hand-rolled

- **Bundle size.** Adding uPlot + Cal-Heatmap + d3-time-format would have added ~60 KB to a popup target where every KB matters. The popup bundle today is 4 KB.
- **Design control.** Terminal Editorial is deliberately minimal — no shadows, no gradients, one accent per view. Overriding Cal-Heatmap's default visual language to match was more work than rendering 371 `<rect>`s ourselves.
- **Simplicity.** A sparkline is one polyline. A trend chart is one polyline + one area fill + one trailing dot. A heatmap is a 7×53 grid of `<rect>`s with `<title>` tooltips. None of this needs a dependency.

## When we'd revisit

- **uPlot:** if we start doing brush-select, zoom, dense multi-series overlays, or panning. Phase 3's comparison bar chart could trigger this.
- **Cal-Heatmap:** if we need click-to-zoom-into-day drilldowns or animated year transitions. Phase 5's hour-of-day radial might.

## Trade-offs

- Our charts don't have tooltips beyond the native `<title>` element. Fine on hover, not great on mobile.
- No axes by default. Our TrendChart has x-labels; y-scale is implicit.

## Related

- [[../entities/Terminal-Editorial]]
- `apps/chrome/components/Sparkline.tsx`
- `apps/chrome/components/Heatmap.tsx`
- `apps/chrome/components/TrendChart.tsx`
