export interface StorageDriver {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  subscribe<T>(key: string, onChange: (value: T | null) => void): () => void;
}

export function createMemoryDriver(): StorageDriver {
  const store = new Map<string, unknown>();
  const listeners = new Map<string, Set<(value: unknown) => void>>();

  function notify(key: string, value: unknown): void {
    const set = listeners.get(key);
    if (!set) return;
    for (const listener of set) listener(value);
  }

  return {
    async get<T>(key: string): Promise<T | null> {
      return store.has(key) ? (store.get(key) as T) : null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      store.set(key, value);
      notify(key, value);
    },
    async remove(key: string): Promise<void> {
      store.delete(key);
      notify(key, null);
    },
    subscribe<T>(key: string, onChange: (value: T | null) => void): () => void {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      const wrapped = (value: unknown): void => onChange(value as T | null);
      set.add(wrapped);
      return () => {
        set!.delete(wrapped);
      };
    },
  };
}
