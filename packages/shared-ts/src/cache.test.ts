import { describe, expect, it, vi } from 'vitest';
import { Cache } from './cache';
import { createMemoryDriver } from './storage';

describe('Cache', () => {
  it('returns null when nothing is stored', async () => {
    const driver = createMemoryDriver();
    const cache = new Cache<string>(driver, 'x', { ttlMs: 1000 });
    expect(await cache.readFresh()).toBeNull();
    expect(await cache.readStale()).toBeNull();
  });

  it('returns fresh value within TTL', async () => {
    const driver = createMemoryDriver();
    let t = 1000;
    const cache = new Cache<string>(driver, 'x', { ttlMs: 1000, now: () => t });
    await cache.write('hello');
    t = 1500;
    expect(await cache.readFresh()).toBe('hello');
  });

  it('returns null from readFresh after TTL expires', async () => {
    const driver = createMemoryDriver();
    let t = 1000;
    const cache = new Cache<string>(driver, 'x', { ttlMs: 1000, now: () => t });
    await cache.write('hello');
    t = 2500;
    expect(await cache.readFresh()).toBeNull();
    expect(await cache.readStale()).toBe('hello');
  });

  it('clear removes the entry', async () => {
    const driver = createMemoryDriver();
    const cache = new Cache<string>(driver, 'x', { ttlMs: 1000 });
    await cache.write('hello');
    await cache.clear();
    expect(await cache.readStale()).toBeNull();
  });

  it('subscribe fires on write and clear', async () => {
    const driver = createMemoryDriver();
    const cache = new Cache<string>(driver, 'x', { ttlMs: 1000 });
    const listener = vi.fn();
    const unsubscribe = cache.subscribe(listener);
    await cache.write('a');
    await cache.write('b');
    await cache.clear();
    expect(listener).toHaveBeenNthCalledWith(1, 'a');
    expect(listener).toHaveBeenNthCalledWith(2, 'b');
    expect(listener).toHaveBeenNthCalledWith(3, null);
    unsubscribe();
    await cache.write('c');
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
