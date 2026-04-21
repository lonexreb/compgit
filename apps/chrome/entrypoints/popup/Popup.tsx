import {
  type ContributionsCollection,
  sparklineSeries,
  streak,
  todayISODate,
} from '@compgit/shared';
import { Button } from '../../components/Button';
import { Sparkline } from '../../components/Sparkline';
import { type ContributionsView, useContributions } from '../../hooks/useContributions';
import type { SyncStatus } from '../../lib/refresh';

export function Popup(): JSX.Element {
  const view = useContributions();

  return (
    <main
      className="flex flex-col justify-between bg-bg text-text font-mono"
      style={{ width: 'var(--popup-width)', height: 'var(--popup-height)' }}
    >
      <Header view={view} />
      {renderBody(view)}
      <Footer view={view} />
    </main>
  );
}

function renderBody(view: ContributionsView): JSX.Element {
  if (view.loading) return <LoadingBody />;
  if (!view.login) return <NeedsSetup />;
  if (!view.collection) {
    if (view.lastSync && !view.lastSync.ok) {
      return <ErrorFirst message={view.lastSync.message ?? 'unknown error'} />;
    }
    return <FetchingFirst />;
  }
  return <ReadyBody collection={view.collection} />;
}

function Header({ view }: { view: ContributionsView }): JSX.Element {
  const stale = isStale(view.lastSync);
  return (
    <header className="flex items-center justify-between px-4 pt-3 text-xs text-text-muted tracking-wider">
      <span>compgit</span>
      {stale ? (
        <span className="text-danger" aria-label="offline">
          offline
        </span>
      ) : (
        <span aria-hidden>··</span>
      )}
    </header>
  );
}

function ReadyBody({ collection }: { collection: ContributionsCollection }): JSX.Element {
  const today = todayISODate();
  const todayCount = collection.days.find((day) => day.date === today)?.contributionCount ?? 0;
  const sparkline = sparklineSeries(collection.days, 7);
  const currentStreak = streak(collection.days, today);

  return (
    <section className="flex-1 flex flex-col items-center justify-center px-6">
      <div
        className="font-display leading-none tabular-nums text-text"
        style={{ fontSize: 'var(--text-display-md)' }}
      >
        {todayCount}
      </div>
      <p className="mt-2 text-xs text-text-muted uppercase tracking-widest">commits today</p>

      <div className="mt-8 flex items-center gap-4 text-xs text-text-muted">
        <Sparkline values={sparkline} ariaLabel="last 7 days of contributions" />
        <span className="tracking-wider">past 7 days</span>
      </div>

      <p className="mt-4 text-xs text-text-faint uppercase tracking-widest">
        {currentStreak > 0 ? `streak ${currentStreak}d` : 'no active streak'}
      </p>
    </section>
  );
}

function NeedsSetup(): JSX.Element {
  return (
    <section className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        className="font-display leading-none tabular-nums text-text-faint"
        style={{ fontSize: 'var(--text-display-md)' }}
      >
        —
      </div>
      <Button onClick={() => chrome.runtime.openOptionsPage()}>set up compgit</Button>
    </section>
  );
}

function FetchingFirst(): JSX.Element {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div
        className="font-display leading-none tabular-nums text-text-faint"
        style={{ fontSize: 'var(--text-display-md)' }}
      >
        ·
      </div>
      <p className="mt-2 text-xs text-text-muted uppercase tracking-widest">fetching your graph…</p>
    </section>
  );
}

function ErrorFirst({ message }: { message: string }): JSX.Element {
  return (
    <section className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        className="font-display leading-none tabular-nums text-danger"
        style={{ fontSize: 'var(--text-display-md)' }}
      >
        ×
      </div>
      <p className="text-xs text-text-muted uppercase tracking-widest">couldn't sync</p>
      <p className="text-xs text-text-faint max-w-[240px]">{message}</p>
      <Button onClick={() => chrome.runtime.openOptionsPage()}>open options</Button>
    </section>
  );
}

function LoadingBody(): JSX.Element {
  return <section className="flex-1" />;
}

function Footer({ view }: { view: ContributionsView }): JSX.Element {
  const line = footerLine(view);
  return (
    <footer className="px-4 pb-4 text-xs text-text-faint">
      <span>{line}</span>
    </footer>
  );
}

function footerLine(view: ContributionsView): string {
  if (!view.login) return 'paste a github token to begin';
  if (!view.lastSync) return `${view.login}`;
  if (!view.lastSync.ok) return `${view.login} · sync error`;
  return `${view.login} · ${relativeTime(new Date(view.lastSync.at))}`;
}

function relativeTime(at: Date): string {
  const deltaMs = Date.now() - at.getTime();
  if (deltaMs < 60_000) return 'just now';
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const STALE_THRESHOLD_MS = 30 * 60 * 1000;

function isStale(lastSync: SyncStatus | null): boolean {
  if (!lastSync) return false;
  if (!lastSync.ok) return true;
  return Date.now() - new Date(lastSync.at).getTime() > STALE_THRESHOLD_MS;
}
