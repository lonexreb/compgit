import {
  AuthError,
  NetworkError,
  RateLimitError,
  ValidationError,
  clearToken,
  fetchViewerLogin,
  loadMeLogin,
  saveMeLogin,
  saveToken,
} from '@compgit/shared';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { useDebounced } from '../../hooks/useDebounced';
import { useStorageValue } from '../../hooks/useStorageValue';
import { createAuthStores, createChromeStorageDriver } from '../../lib/chrome-storage';
import { send } from '../../lib/messages';

type ValidationState =
  | { kind: 'empty' }
  | { kind: 'validating' }
  | { kind: 'valid'; login: string }
  | { kind: 'invalid'; reason: string }
  | { kind: 'rate'; resetAt: Date }
  | { kind: 'offline' };

export function Options(): JSX.Element {
  const authStores = useMemo(() => createAuthStores(), []);
  const localDriver = authStores.local;

  const { value: savedLogin } = useStorageValue<string>(localDriver, 'me.login');
  const { value: savedToken } = useStorageValue<string>(localDriver, 'auth.token');

  const [draft, setDraft] = useState('');
  const [state, setState] = useState<ValidationState>({ kind: 'empty' });
  const [persistedLogin, setPersistedLogin] = useState<string | null>(null);

  const debouncedDraft = useDebounced(draft.trim(), 400);

  useEffect(() => {
    setPersistedLogin(savedLogin ?? null);
  }, [savedLogin]);

  useEffect(() => {
    if (!debouncedDraft) {
      setState({ kind: 'empty' });
      return;
    }
    let cancelled = false;
    setState({ kind: 'validating' });
    (async () => {
      try {
        const login = await fetchViewerLogin(debouncedDraft);
        if (cancelled) return;
        await saveToken(authStores, debouncedDraft);
        await saveMeLogin(localDriver, login);
        await send({ type: 'token-changed' });
        if (cancelled) return;
        setState({ kind: 'valid', login });
      } catch (error: unknown) {
        if (cancelled) return;
        if (error instanceof AuthError) {
          setState({ kind: 'invalid', reason: error.message });
        } else if (error instanceof RateLimitError) {
          setState({ kind: 'rate', resetAt: error.resetAt });
        } else if (error instanceof NetworkError) {
          setState({ kind: 'offline' });
        } else if (error instanceof ValidationError) {
          setState({ kind: 'invalid', reason: error.message });
        } else {
          setState({ kind: 'invalid', reason: 'unknown error' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedDraft, authStores, localDriver]);

  async function handleClear(): Promise<void> {
    await clearToken(authStores);
    await localDriver.remove('me.login');
    await send({ type: 'clear-cache' });
    setPersistedLogin(null);
    setDraft('');
    setState({ kind: 'empty' });
  }

  async function handleForceRefresh(): Promise<void> {
    await send({ type: 'refresh-now' });
  }

  return (
    <main className="min-h-screen bg-bg text-text font-mono">
      <div className="mx-auto max-w-xl px-8 pt-20 pb-24">
        <header className="mb-12">
          <p className="text-xs text-text-muted uppercase tracking-widest">compgit</p>
          <h1
            className="mt-4 font-display text-text leading-tight"
            style={{ fontSize: 'var(--text-display-sm)' }}
          >
            Set up compgit.
          </h1>
          <p className="mt-4 text-sm text-text-muted max-w-md leading-relaxed">
            Paste a fine-grained GitHub Personal Access Token with{' '}
            <span className="text-text">read:user</span> scope. The token stays on this device and
            is only used to query your public contribution graph.
          </p>
          <p className="mt-2 text-xs text-text-faint">
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-text"
            >
              github.com/settings/personal-access-tokens/new ↗
            </a>
          </p>
        </header>

        <section className="border-t border-border pt-8">
          <label className="block">
            <span className="text-xs text-text-muted uppercase tracking-widest">Token</span>
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={persistedLogin ? `signed in as ${persistedLogin}` : 'github_pat_…'}
              className="mt-3 w-full bg-surface border border-border px-3 py-3 font-mono text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-accent"
            />
          </label>

          <div className="mt-4 min-h-[1.5rem] text-xs">
            <StateLine state={state} />
          </div>
        </section>

        <section className="mt-12 flex flex-wrap gap-3 border-t border-border pt-8">
          <Button onClick={handleForceRefresh} disabled={!savedToken}>
            refresh now
          </Button>
          <Button tone="danger" onClick={handleClear} disabled={!savedToken && !persistedLogin}>
            clear token & cache
          </Button>
        </section>

        <footer className="mt-20 border-t border-border pt-6 text-xs text-text-faint leading-relaxed">
          <p>
            compgit stores your token locally in chrome.storage.local. It is never sent anywhere
            except api.github.com. To revoke it, delete the token on GitHub and clear it here.
          </p>
        </footer>
      </div>
    </main>
  );
}

function StateLine({ state }: { state: ValidationState }): JSX.Element | null {
  switch (state.kind) {
    case 'empty':
      return <span className="text-text-faint">paste a token to validate it live</span>;
    case 'validating':
      return <span className="text-text-muted">checking with github…</span>;
    case 'valid':
      return (
        <span className="text-accent">
          ✓ valid · signed in as <span className="text-text">{state.login}</span>
        </span>
      );
    case 'invalid':
      return <span className="text-danger">✗ {state.reason}</span>;
    case 'rate':
      return (
        <span className="text-danger">
          rate limited · resets{' '}
          {state.resetAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      );
    case 'offline':
      return <span className="text-text-muted">offline — can't reach github right now</span>;
  }
}
