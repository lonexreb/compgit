import {
  type ContributionsCollection,
  daysAgoISODate,
  sparklineSeries,
  streak,
  todayISODate,
  totalInWindow,
} from '@compgit/shared';
import { Sparkline } from '../../components/Sparkline';
import { Stat } from '../../components/Stat';

interface TodayTabProps {
  collection: ContributionsCollection;
}

export function TodayTab({ collection }: TodayTabProps): JSX.Element {
  const today = todayISODate();
  const todayCount = collection.days.find((day) => day.date === today)?.contributionCount ?? 0;

  const weekStart = daysAgoISODate(6);
  const monthStart = daysAgoISODate(29);
  const yearStart = daysAgoISODate(364);

  const weekTotal = totalInWindow(collection.days, weekStart, today);
  const monthTotal = totalInWindow(collection.days, monthStart, today);
  const yearTotal = totalInWindow(collection.days, yearStart, today);

  const fourteenDay = sparklineSeries(collection.days, 14);
  const currentStreak = streak(collection.days, today);

  return (
    <div className="flex flex-col gap-12">
      <section>
        <p className="text-xs uppercase tracking-widest text-text-muted">commits today</p>
        <div
          className="mt-2 font-display leading-none tabular-nums text-text"
          style={{ fontSize: 'var(--text-display-lg)' }}
        >
          {todayCount}
        </div>
      </section>

      <section className="flex items-end gap-6 border-t border-border pt-6">
        <Sparkline
          values={fourteenDay}
          width={200}
          height={40}
          ariaLabel="last 14 days of contributions"
        />
        <span className="text-xs uppercase tracking-widest text-text-muted pb-1">past 14 days</span>
      </section>

      <section className="grid grid-cols-4 gap-6 border-t border-border pt-6">
        <Stat label="this week" value={weekTotal} />
        <Stat label="past 30d" value={monthTotal} />
        <Stat label="past year" value={yearTotal} />
        <Stat
          label="streak"
          value={currentStreak > 0 ? `${currentStreak}d` : '—'}
          hint={currentStreak === 0 ? 'ship something' : undefined}
        />
      </section>
    </div>
  );
}
