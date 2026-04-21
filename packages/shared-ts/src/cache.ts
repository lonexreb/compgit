import type { StorageDriver } from './storage';

interface CacheEntry<T> {
  value: T;
  fetchedAt: number;
}

export interface CacheOptions {
  ttlMs: number;
  now?: () => number;
}

export class Cache<T> {
  private readonly driver: StorageDriver;
  private readonly key: string;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(driver: StorageDriver, key: string, options: CacheOptions) {
    this.driver = driver;
    this.key = key;
    this.ttlMs = options.ttlMs;
    this.now = options.now ?? Date.now;
  }

  async write(value: T): Promise<void> {
    const entry: CacheEntry<T> = { value, fetchedAt: this.now() };
    await this.driver.set(this.key, entry);
  }

  async readFresh(): Promise<T | null> {
    const entry = await this.driver.get<CacheEntry<T>>(this.key);
    if (!entry) return null;
    if (this.now() - entry.fetchedAt > this.ttlMs) return null;
    return entry.value;
  }

  async readStale(): Promise<T | null> {
    const entry = await this.driver.get<CacheEntry<T>>(this.key);
    return entry ? entry.value : null;
  }

  async clear(): Promise<void> {
    await this.driver.remove(this.key);
  }

  subscribe(onChange: (value: T | null) => void): () => void {
    return this.driver.subscribe<CacheEntry<T>>(this.key, (entry) => {
      onChange(entry ? entry.value : null);
    });
  }
}
