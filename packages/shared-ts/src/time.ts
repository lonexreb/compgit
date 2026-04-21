/**
 * ISO-8601 calendar-date helpers. All functions take an optional `now` for
 * deterministic testing; callers in widget/extension code omit it.
 */

function formatYmd(date: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function todayISODate(now: Date = new Date(), timeZone?: string): string {
  return formatYmd(now, timeZone);
}

export function daysAgoISODate(n: number, now: Date = new Date(), timeZone?: string): string {
  const shifted = new Date(now);
  shifted.setUTCDate(shifted.getUTCDate() - n);
  return formatYmd(shifted, timeZone);
}

/**
 * Inclusive range of ISO dates between `from` and `to`.
 * Both bounds must be YYYY-MM-DD strings. Returns [] if from > to.
 */
export function rangeDates(from: string, to: string): string[] {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (start.getTime() > end.getTime()) return [];
  const out: string[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    out.push(formatYmd(cursor, 'UTC'));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function isoWeekKey(date: string): string {
  // ISO week starts Monday. Returns YYYY-Www.
  const d = new Date(`${date}T00:00:00Z`);
  const dayOfWeek = d.getUTCDay() || 7;
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const year = thursday.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const weekNumber = Math.ceil(((thursday.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function yearKey(date: string): number {
  return Number.parseInt(date.slice(0, 4), 10);
}
