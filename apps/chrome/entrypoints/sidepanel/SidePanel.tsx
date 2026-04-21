import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Tabs } from '../../components/Tabs';
import { type ContributionsView, useContributions } from '../../hooks/useContributions';
import { HeatmapTab } from './HeatmapTab';
import { TodayTab } from './TodayTab';
import { TrendsTab } from './TrendsTab';

type TabId = 'today' | 'heatmap' | 'trends';
const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'today', label: 'today' },
  { id: 'heatmap', label: 'heatmap' },
  { id: 'trends', label: 'trends' },
];

function currentTab(): TabId {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === 'heatmap' || hash === 'trends' || hash === 'today') return hash;
  return 'today';
}

export function SidePanel(): JSX.Element {
  const view = useContributions();
  const [active, setActive] = useState<TabId>(currentTab);

  useEffect(() => {
    window.location.hash = active;
  }, [active]);

  useEffect(() => {
    const onHashChange = (): void => setActive(currentTab());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <main className="min-h-screen bg-bg text-text font-mono px-8 pt-10 pb-16">
      <header className="flex items-baseline justify-between border-b border-border pb-4">
        <div className="flex items-baseline gap-8">
          <span className="text-xs uppercase tracking-widest text-text-muted">compgit</span>
          <Tabs value={active} onChange={setActive} tabs={TABS} ariaLabel="compgit views" />
        </div>
        <FooterMeta view={view} />
      </header>

      <div className="pt-10">{renderTab(active, view)}</div>
    </main>
  );
}

function renderTab(tab: TabId, view: ContributionsView): JSX.Element {
  if (view.loading) return <BlankState label="loading…" />;
  if (!view.login) return <SetupPrompt />;
  if (!view.collection) {
    if (view.lastSync && !view.lastSync.ok) {
      return <ErrorPrompt message={view.lastSync.message ?? 'unknown error'} />;
    }
    return <BlankState label="fetching your graph…" />;
  }

  switch (tab) {
    case 'today':
      return <TodayTab collection={view.collection} />;
    case 'heatmap':
      return <HeatmapTab collection={view.collection} />;
    case 'trends':
      return <TrendsTab collection={view.collection} />;
  }
}

function ErrorPrompt({ message }: { message: string }): JSX.Element {
  return (
    <section className="flex flex-col items-start gap-4">
      <p className="text-xs uppercase tracking-widest text-danger">couldn't sync with github</p>
      <p className="text-sm text-text-muted max-w-md">{message}</p>
      <Button onClick={() => chrome.runtime.openOptionsPage()}>open options</Button>
    </section>
  );
}

function SetupPrompt(): JSX.Element {
  return (
    <section className="flex flex-col items-start gap-6">
      <p className="text-sm text-text-muted max-w-md leading-relaxed">
        compgit needs a GitHub Personal Access Token to query your contribution graph. Open the
        options page to paste one.
      </p>
      <Button onClick={() => chrome.runtime.openOptionsPage()}>set up compgit</Button>
    </section>
  );
}

function BlankState({ label }: { label: string }): JSX.Element {
  return <p className="text-xs text-text-muted uppercase tracking-widest">{label}</p>;
}

function FooterMeta({ view }: { view: ContributionsView }): JSX.Element | null {
  if (!view.login) return null;
  const status = view.lastSync;
  if (!status) {
    return <span className="text-xs text-text-muted">{view.login}</span>;
  }
  const text = status.ok ? 'synced' : 'sync error';
  return (
    <span className="text-xs text-text-muted">
      {view.login} · <span className={status.ok ? 'text-text-faint' : 'text-danger'}>{text}</span>
    </span>
  );
}
