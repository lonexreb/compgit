import { type ContributionsCollection, todayISODate } from '@compgit/shared';
import { Heatmap } from '../../components/Heatmap';

interface HeatmapTabProps {
  collection: ContributionsCollection;
}

export function HeatmapTab({ collection }: HeatmapTabProps): JSX.Element {
  const today = todayISODate();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-xs uppercase tracking-widest text-text-muted">
          past year · {collection.totalContributions} contributions
        </p>
        <div className="mt-4 overflow-x-auto">
          <Heatmap days={collection.days} today={today} />
        </div>
      </section>

      <section className="flex items-center gap-3 text-xs text-text-muted">
        <span className="uppercase tracking-widest text-text-faint">less</span>
        <span className="inline-block h-3 w-3" style={{ background: 'var(--color-level-0)' }} />
        <span className="inline-block h-3 w-3" style={{ background: 'var(--color-level-1)' }} />
        <span className="inline-block h-3 w-3" style={{ background: 'var(--color-level-2)' }} />
        <span className="inline-block h-3 w-3" style={{ background: 'var(--color-level-3)' }} />
        <span className="inline-block h-3 w-3" style={{ background: 'var(--color-level-4)' }} />
        <span className="uppercase tracking-widest text-text-faint">more</span>
      </section>
    </div>
  );
}
