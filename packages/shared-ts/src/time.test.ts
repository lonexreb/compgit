import { describe, expect, it } from 'vitest';
import { daysAgoISODate, isoWeekKey, monthKey, rangeDates, todayISODate, yearKey } from './time';

describe('todayISODate', () => {
  it('returns YYYY-MM-DD in UTC', () => {
    const fixed = new Date('2026-04-20T13:46:00Z');
    expect(todayISODate(fixed, 'UTC')).toBe('2026-04-20');
  });

  it('respects a non-UTC timezone', () => {
    const fixed = new Date('2026-04-20T02:00:00Z'); // 10am in Asia/Karachi (+05)
    expect(todayISODate(fixed, 'Asia/Karachi')).toBe('2026-04-20');
    expect(todayISODate(fixed, 'America/Los_Angeles')).toBe('2026-04-19');
  });
});

describe('daysAgoISODate', () => {
  it('subtracts N calendar days', () => {
    const fixed = new Date('2026-04-20T13:46:00Z');
    expect(daysAgoISODate(0, fixed, 'UTC')).toBe('2026-04-20');
    expect(daysAgoISODate(6, fixed, 'UTC')).toBe('2026-04-14');
    expect(daysAgoISODate(365, fixed, 'UTC')).toBe('2025-04-20');
  });
});

describe('rangeDates', () => {
  it('returns inclusive date sequence', () => {
    expect(rangeDates('2026-04-18', '2026-04-20')).toEqual([
      '2026-04-18',
      '2026-04-19',
      '2026-04-20',
    ]);
  });

  it('handles single-day window', () => {
    expect(rangeDates('2026-04-20', '2026-04-20')).toEqual(['2026-04-20']);
  });

  it('returns empty when from > to', () => {
    expect(rangeDates('2026-04-20', '2026-04-18')).toEqual([]);
  });

  it('crosses month boundaries', () => {
    expect(rangeDates('2026-01-30', '2026-02-02')).toEqual([
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
      '2026-02-02',
    ]);
  });
});

describe('isoWeekKey', () => {
  it('returns ISO week key with Monday as week start', () => {
    // 2026-01-05 is a Monday
    expect(isoWeekKey('2026-01-05')).toBe('2026-W02');
    // 2026-04-20 is a Monday
    expect(isoWeekKey('2026-04-20')).toBe('2026-W17');
  });
});

describe('monthKey / yearKey', () => {
  it('extract month and year from ISO date', () => {
    expect(monthKey('2026-04-20')).toBe('2026-04');
    expect(yearKey('2026-04-20')).toBe(2026);
  });
});
