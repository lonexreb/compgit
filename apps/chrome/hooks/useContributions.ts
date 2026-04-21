import type { ContributionsCollection } from '@compgit/shared';
import { useMemo } from 'react';
import { createChromeStorageDriver } from '../lib/chrome-storage';
import type { SyncStatus } from '../lib/refresh';
import { useStorageValue } from './useStorageValue';

export interface ContributionsView {
  login: string | null;
  collection: ContributionsCollection | null;
  lastSync: SyncStatus | null;
  loading: boolean;
}

const UNUSED_KEY = '__compgit_unused__';

export function useContributions(): ContributionsView {
  const driver = useMemo(() => createChromeStorageDriver('local'), []);

  const { value: login, loading: loadingLogin } = useStorageValue<string>(driver, 'me.login');
  const contributionsKey = login ? `contributions:${login}` : UNUSED_KEY;
  const { value: collection, loading: loadingCollection } =
    useStorageValue<ContributionsCollection>(driver, contributionsKey);
  const { value: lastSync } = useStorageValue<SyncStatus>(driver, 'last-sync');

  const loading = loadingLogin || (!!login && loadingCollection);

  return {
    login,
    collection: login ? collection : null,
    lastSync,
    loading,
  };
}
