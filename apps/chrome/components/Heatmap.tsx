import type { ContributionDay, ContributionLevel } from '@compgit/shared';

interface HeatmapProps {
  days: ContributionDay[];
  today?: string;
  cell?: number;
  gap?: number;
}

const LEVEL_VAR: Record<ContributionLevel, string> = {
  NONE: 'var(--color-level-0)',
  FIRST_QUARTILE: 'var(--color-level-1)',
  SECOND_QUARTILE: 'var(--color-level-2)',
  THIRD_QUARTILE: 'var(--color-level-3)',
  FOURTH_QUARTILE: 'var(--color-level-4)',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * GitHub-style contribution grid.
 * 7 rows (Sun→Sat, top→bottom) × up to 53 columns (weeks).
 * Sourced from ContributionDay[] sorted oldest-first.
 */
export function Heatmap({ days, today, cell = 11, gap = 3 }: HeatmapProps): JSX.Element | null {
  if (days.length === 0) return null;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(`${sorted[0]!.date}T00:00:00Z`);
  const firstDow = firstDate.getUTCDay();

  type Cell = { date: string; count: number; level: ContributionLevel; col: number; row: number };
  const cells: Cell[] = [];
  let totalCols = 0;

  for (let i = 0; i < sorted.length; i += 1) {
    const day = sorted[i]!;
    const offset = i + firstDow;
    const col = Math.floor(offset / 7);
    const row = offset % 7;
    cells.push({
      date: day.date,
      count: day.contributionCount,
      level: day.contributionLevel,
      col,
      row,
    });
    if (col + 1 > totalCols) totalCols = col + 1;
  }

  const labelOffsetY = 12;
  const labelOffsetX = 22;
  const width = labelOffsetX + totalCols * (cell + gap);
  const height = labelOffsetY + 7 * (cell + gap);

  const monthTicks: Array<{ col: number; label: string }> = [];
  let lastMonthShown = -1;
  for (const c of cells) {
    if (c.row !== 0) continue;
    const month = Number.parseInt(c.date.slice(5, 7), 10) - 1;
    if (month !== lastMonthShown) {
      monthTicks.push({ col: c.col, label: MONTH_LABELS[month] ?? '' });
      lastMonthShown = month;
    }
  }

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label="contribution heatmap"
      className="text-text-muted"
    >
      {monthTicks.map(({ col, label }) => (
        <text
          key={`${label}-${col}`}
          x={labelOffsetX + col * (cell + gap)}
          y={labelOffsetY - 4}
          fontSize={10}
          fill="currentColor"
        >
          {label}
        </text>
      ))}
      {DAY_LABELS.map((label, row) =>
        row % 2 === 1 ? (
          <text
            key={label}
            x={0}
            y={labelOffsetY + row * (cell + gap) + cell - 1}
            fontSize={10}
            fill="currentColor"
          >
            {label}
          </text>
        ) : null,
      )}
      {cells.map((c) => {
        const isToday = today && c.date === today;
        return (
          <rect
            key={c.date}
            x={labelOffsetX + c.col * (cell + gap)}
            y={labelOffsetY + c.row * (cell + gap)}
            width={cell}
            height={cell}
            fill={LEVEL_VAR[c.level]}
            stroke={isToday ? 'var(--color-accent)' : 'none'}
            strokeWidth={isToday ? 1 : 0}
          >
            <title>
              {`${c.date} · ${c.count} ${c.count === 1 ? 'contribution' : 'contributions'}`}
            </title>
          </rect>
        );
      })}
    </svg>
  );
}
