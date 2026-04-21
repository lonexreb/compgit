interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  points: TrendPoint[];
  width?: number;
  height?: number;
  ariaLabel?: string;
}

/**
 * Minimal line chart: polyline + area fill + accent dot on the trailing value.
 * X-axis labels are picked by the caller (e.g. every 7th day for a 30-day view).
 */
export function TrendChart({
  points,
  width = 560,
  height = 160,
  ariaLabel,
}: TrendChartProps): JSX.Element | null {
  if (points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.value), 1);

  const padX = 12;
  const padTop = 8;
  const padBottom = 20;
  const plotWidth = width - padX * 2;
  const plotHeight = height - padTop - padBottom;

  const lastIndex = points.length - 1;
  const stepX = lastIndex === 0 ? 0 : plotWidth / lastIndex;

  const coords = points.map((p, i) => ({
    label: p.label,
    value: p.value,
    x: padX + (lastIndex === 0 ? plotWidth / 2 : i * stepX),
    y: padTop + plotHeight - (p.value / max) * plotHeight,
  }));

  const lineD = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(' ');

  const areaD = `${lineD} L ${coords[coords.length - 1]!.x.toFixed(2)} ${
    padTop + plotHeight
  } L ${coords[0]!.x.toFixed(2)} ${padTop + plotHeight} Z`;

  // Show ~5 evenly spaced x-labels.
  const labelInterval = Math.max(1, Math.floor(points.length / 5));

  return (
    <svg width={width} height={height} role="img" aria-label={ariaLabel ?? 'trend chart'}>
      <path d={areaD} fill="var(--color-accent)" opacity={0.08} />
      <path
        d={lineD}
        fill="none"
        stroke="var(--color-text-muted)"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {coords.map((c, i) => {
        const isLast = i === coords.length - 1;
        return (
          <circle
            key={`${c.label}-${i}`}
            cx={c.x}
            cy={c.y}
            r={isLast ? 2.5 : 0}
            fill="var(--color-accent)"
          />
        );
      })}
      {coords.map((c, i) =>
        i % labelInterval === 0 || i === coords.length - 1 ? (
          <text
            key={`label-${c.label}-${i}`}
            x={c.x}
            y={height - 4}
            textAnchor="middle"
            fontSize={10}
            fill="var(--color-text-faint)"
          >
            {c.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
