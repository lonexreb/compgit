import {
  type ContributionsCollection,
  type StorageDriver,
  fetchContributionsCollection,
  loadMeLogin,
  loadToken,
} from '@compgit/shared';
import { createAuthStores } from './chrome-storage';

export interface SyncStatus {
  at: string;
  ok: boolean;
  message?: string;
}

export type RefreshOutcome =
  | { ok: true; login: string; collection: ContributionsCollection }
  | { ok: false; reason: string };

export const LAST_SYNC_KEY = 'last-sync';
export const CONTRIBUTIONS_PREFIX = 'contributions:';

const WINDOW_DAYS = 365;
const MS_PER_DAY = 86_400_000;

interface RefreshDeps {
  session: StorageDriver;
  local: StorageDriver;
  now?: () => Date;
  fetchImpl?: (input: string, init: RequestInit) => Promise<Response>;
}

export async function refreshContributions(deps?: RefreshDeps): Promise<RefreshOutcome> {
  const stores = deps ?? createAuthStores();
  const now = (deps?.now ?? (() => new Date()))();
  const token = await loadToken({ session: stores.session, local: stores.local });
  const login = await loadMeLogin(stores.local);
  if (!token || !login) {
    return { ok: false, reason: 'no auth' };
  }

  const to = now.toISOString();
  const from = new Date(now.getTime() - WINDOW_DAYS * MS_PER_DAY).toISOString();

  try {
    const collection = await fetchContributionsCollection({
      login,
      from,
      to,
      token,
      ...(deps?.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
      now: () => now,
    });
    await stores.local.set(`${CONTRIBUTIONS_PREFIX}${login}`, collection);
    const status: SyncStatus = { at: now.toISOString(), ok: true };
    await stores.local.set(LAST_SYNC_KEY, status);
    return { ok: true, login, collection };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    const status: SyncStatus = { at: now.toISOString(), ok: false, message };
    await stores.local.set(LAST_SYNC_KEY, status);
    return { ok: false, reason: message };
  }
}

export async function clearAllContributions(local: StorageDriver): Promise<void> {
  const raw = (await chrome.storage.local.get(null)) as Record<string, unknown>;
  const keysToDrop = Object.keys(raw).filter(
    (key) => key.startsWith(CONTRIBUTIONS_PREFIX) || key === LAST_SYNC_KEY,
  );
  await Promise.all(keysToDrop.map((key) => local.remove(key)));
}
