interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  accent?: string;
  ariaLabel?: string;
}

/**
 * Minimal SVG sparkline — one polyline, accent dot on the trailing value.
 * Zero dependencies, zero animation (motion handled by the caller if needed).
 */
export function Sparkline({
  values,
  width = 120,
  height = 24,
  stroke = 'var(--color-text-muted)',
  accent = 'var(--color-accent)',
  ariaLabel,
}: SparklineProps): JSX.Element | null {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const lastIndex = values.length - 1;
  const denominator = lastIndex === 0 ? 1 : lastIndex;
  const stepX = width / denominator;
  const padY = 2;
  const usableH = height - padY * 2;

  const points = values.map((v, i) => ({
    x: lastIndex === 0 ? width / 2 : i * stepX,
    y: padY + (usableH - (v / max) * usableH),
  }));

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const last = points[points.length - 1]!;

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel ?? `sparkline of ${values.length} values`}
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={1} strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={2.5} fill={accent} />
    </svg>
  );
}
