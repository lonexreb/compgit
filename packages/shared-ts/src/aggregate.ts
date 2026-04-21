import type { ContributionDay } from './generated';
import { isoWeekKey, monthKey, yearKey } from './time';

export interface Bucket {
  key: string;
  total: number;
}

/** Sum of contributions for days in [from, to] inclusive. */
export function totalInWindow(days: ContributionDay[], from: string, to: string): number {
  let sum = 0;
  for (const day of days) {
    if (day.date >= from && day.date <= to) sum += day.contributionCount;
  }
  return sum;
}

/** Last N days as a bare number array, oldest-first, zero-padded if the input is shorter. */
export function sparklineSeries(days: ContributionDay[], n: number): number[] {
  if (n <= 0) return [];
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const tail = sorted.slice(-n).map((day) => day.contributionCount);
  if (tail.length >= n) return tail;
  return [...new Array(n - tail.length).fill(0), ...tail];
}

/**
 * Current consecutive-day commit streak. Walks backward from `today` or from
 * the newest day in `days`. A zero-contribution *today* does not reset the
 * streak — the streak resumes from yesterday, matching what a developer would
 * intuit looking at their graph at 10am.
 */
export function streak(days: ContributionDay[], today?: string): number {
  if (days.length === 0) return 0;
  const byDate = new Map(days.map((d) => [d.date, d.contributionCount]));
  const sortedDates = [...byDate.keys()].sort();
  const anchor = today ?? sortedDates[sortedDates.length - 1]!;
  let cursor = anchor;
  let count = 0;
  let allowSkipToday = true;
  while (byDate.has(cursor)) {
    const contributions = byDate.get(cursor)!;
    if (contributions > 0) {
      count += 1;
      allowSkipToday = false;
    } else if (allowSkipToday && cursor === anchor) {
      allowSkipToday = false;
    } else {
      break;
    }
    cursor = previousDate(cursor);
  }
  return count;
}

function previousDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function bucketBy<Key>(days: ContributionDay[], keyOf: (date: string) => Key): Map<Key, number> {
  const buckets = new Map<Key, number>();
  for (const day of days) {
    const key = keyOf(day.date);
    buckets.set(key, (buckets.get(key) ?? 0) + day.contributionCount);
  }
  return buckets;
}

export function byWeek(days: ContributionDay[]): Bucket[] {
  const buckets = bucketBy(days, isoWeekKey);
  return [...buckets.entries()]
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function byMonth(days: ContributionDay[]): Bucket[] {
  const buckets = bucketBy(days, monthKey);
  return [...buckets.entries()]
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function byYear(days: ContributionDay[]): Bucket[] {
  const buckets = bucketBy(days, yearKey);
  return [...buckets.entries()]
    .map(([key, total]) => ({ key: String(key), total }))
    .sort((a, b) => a.key.localeCompare(b.key));
}
