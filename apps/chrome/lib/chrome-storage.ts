import type { StorageDriver } from '@compgit/shared';

type Area = 'local' | 'session';

/**
 * StorageDriver backed by chrome.storage.*. The options/popup/sidepanel share
 * state through chrome.storage.local; the background worker mirrors hot tokens
 * into chrome.storage.session for lower-latency reads in-view.
 */
export function createChromeStorageDriver(area: Area): StorageDriver {
  const bucket = chrome.storage[area];

  return {
    async get<T>(key: string): Promise<T | null> {
      const result = await bucket.get(key);
      const value = result[key];
      return value === undefined ? null : (value as T);
    },
    async set<T>(key: string, value: T): Promise<void> {
      await bucket.set({ [key]: value });
    },
    async remove(key: string): Promise<void> {
      await bucket.remove(key);
    },
    subscribe<T>(key: string, onChange: (value: T | null) => void): () => void {
      const handler = (
        changes: Record<string, chrome.storage.StorageChange>,
        changedArea: chrome.storage.AreaName,
      ): void => {
        if (changedArea !== area) return;
        if (!(key in changes)) return;
        const next = changes[key]?.newValue;
        onChange(next === undefined ? null : (next as T));
      };
      chrome.storage.onChanged.addListener(handler);
      return () => chrome.storage.onChanged.removeListener(handler);
    },
  };
}

export function createAuthStores(): {
  session: StorageDriver;
  local: StorageDriver;
} {
  return {
    session: createChromeStorageDriver('session'),
    local: createChromeStorageDriver('local'),
  };
}
