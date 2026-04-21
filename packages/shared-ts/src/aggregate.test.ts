import { describe, expect, it } from 'vitest';
import { byMonth, byWeek, byYear, sparklineSeries, streak, totalInWindow } from './aggregate';
import type { ContributionDay } from './generated';

function day(date: string, count: number): ContributionDay {
  return {
    date,
    contributionCount: count,
    contributionLevel: count === 0 ? 'NONE' : 'FIRST_QUARTILE',
  };
}

const week: ContributionDay[] = [
  day('2026-04-14', 2),
  day('2026-04-15', 0),
  day('2026-04-16', 5),
  day('2026-04-17', 1),
  day('2026-04-18', 0),
  day('2026-04-19', 3),
  day('2026-04-20', 4),
];

describe('totalInWindow', () => {
  it('sums contributions inside the window', () => {
    expect(totalInWindow(week, '2026-04-14', '2026-04-20')).toBe(15);
  });

  it('excludes days outside the window', () => {
    expect(totalInWindow(week, '2026-04-18', '2026-04-20')).toBe(7);
  });

  it('returns 0 for an empty window', () => {
    expect(totalInWindow([], '2026-04-01', '2026-04-20')).toBe(0);
  });
});

describe('sparklineSeries', () => {
  it('returns the last N days in chronological order', () => {
    expect(sparklineSeries(week, 3)).toEqual([0, 3, 4]);
  });

  it('left-pads with zeros if fewer than N days available', () => {
    expect(sparklineSeries(week.slice(-2), 5)).toEqual([0, 0, 0, 3, 4]);
  });

  it('returns [] for non-positive N', () => {
    expect(sparklineSeries(week, 0)).toEqual([]);
  });
});

describe('streak', () => {
  it('counts consecutive days of commits', () => {
    // from 04-14: 2, 0, 5, 1, 0, 3, 4. Anchor = 04-20 → streak = 2 (04-19, 04-20)
    expect(streak(week, '2026-04-20')).toBe(2);
  });

  it('tolerates zero on the anchor day', () => {
    // Anchor = 04-18 (0). Skip anchor → 04-17 (1), 04-16 (5), break at 04-15 (0). Streak = 2.
    expect(streak(week, '2026-04-18')).toBe(2);
  });

  it('returns 0 for empty input', () => {
    expect(streak([], '2026-04-20')).toBe(0);
  });

  it('handles an all-zeros history', () => {
    const zeros = week.map((d) => ({ ...d, contributionCount: 0 }));
    expect(streak(zeros, '2026-04-20')).toBe(0);
  });
});

describe('byWeek / byMonth / byYear', () => {
  it('groups contributions into ISO weeks', () => {
    const buckets = byWeek(week);
    // 2026-04-14 through 2026-04-20 straddle W16/W17 (Monday 04-20 starts W17).
    const totals = new Map(buckets.map((b) => [b.key, b.total]));
    expect(totals.get('2026-W16')! + totals.get('2026-W17')!).toBe(15);
  });

  it('groups into months', () => {
    expect(byMonth(week)).toEqual([{ key: '2026-04', total: 15 }]);
  });

  it('groups into years', () => {
    const mixed = [...week, day('2025-12-31', 7)];
    expect(byYear(mixed)).toEqual([
      { key: '2025', total: 7 },
      { key: '2026', total: 15 },
    ]);
  });
});
