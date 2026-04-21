import {
  type ContributionDay,
  type ContributionsCollection,
  byMonth,
  byWeek,
  daysAgoISODate,
  todayISODate,
} from '@compgit/shared';
import { useState } from 'react';
import { TrendChart } from '../../components/TrendChart';

type Period = '7d' | '30d' | '90d' | '1y';

const PERIODS: Array<{ id: Period; label: string; days: number }> = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: '1y', label: '1 year', days: 365 },
];

interface TrendsTabProps {
  collection: ContributionsCollection;
}

export function TrendsTab({ collection }: TrendsTabProps): JSX.Element {
  const [period, setPeriod] = useState<Period>('30d');
  const config = PERIODS.find((p) => p.id === period)!;

  const windowDays = filterWindow(collection.days, config.days);
  const points = seriesFor(period, windowDays);
  const total = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted">
            {config.label} · {total} contributions
          </p>
        </div>
        <nav aria-label="trend period" className="flex gap-4 text-xs">
          {PERIODS.map(({ id, label }) => (
            <button
              type="button"
              key={id}
              aria-pressed={period === id}
              onClick={() => setPeriod(id)}
              className={`uppercase tracking-widest transition-colors duration-150 focus:outline-none ${
                period === id ? 'text-accent' : 'text-text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </section>

      <section className="border-t border-border pt-6">
        <div className="overflow-x-auto">
          <TrendChart points={points} ariaLabel={`${config.label} trend`} />
        </div>
      </section>
    </div>
  );
}

function filterWindow(days: ContributionDay[], n: number): ContributionDay[] {
  const today = todayISODate();
  const from = daysAgoISODate(n - 1);
  return days.filter((d) => d.date >= from && d.date <= today);
}

function seriesFor(
  period: Period,
  days: ContributionDay[],
): Array<{ label: string; value: number }> {
  switch (period) {
    case '7d':
    case '30d':
      return days.map((d) => ({ label: d.date.slice(5), value: d.contributionCount }));
    case '90d':
      return byWeek(days).map((b) => ({ label: b.key.slice(5), value: b.total }));
    case '1y':
      return byMonth(days).map((b) => ({ label: b.key.slice(5), value: b.total }));
  }
}
