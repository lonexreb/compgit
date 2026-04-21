import { describe, expect, it } from 'vitest';
import { clearToken, loadMeLogin, loadToken, saveMeLogin, saveToken } from './auth';
import { createMemoryDriver } from './storage';

function makeStores() {
  return { session: createMemoryDriver(), local: createMemoryDriver() };
}

describe('auth token', () => {
  it('returns null when no token stored', async () => {
    const stores = makeStores();
    expect(await loadToken(stores)).toBeNull();
  });

  it('saves to both session and local', async () => {
    const stores = makeStores();
    await saveToken(stores, 'ghp_abc');
    expect(await stores.session.get('auth.token')).toBe('ghp_abc');
    expect(await stores.local.get('auth.token')).toBe('ghp_abc');
  });

  it('prefers session when both present', async () => {
    const stores = makeStores();
    await stores.session.set('auth.token', 'hot');
    await stores.local.set('auth.token', 'cold');
    expect(await loadToken(stores)).toBe('hot');
  });

  it('primes session from local on cold read', async () => {
    const stores = makeStores();
    await stores.local.set('auth.token', 'cold');
    expect(await loadToken(stores)).toBe('cold');
    expect(await stores.session.get('auth.token')).toBe('cold');
  });

  it('clearToken wipes both stores', async () => {
    const stores = makeStores();
    await saveToken(stores, 'ghp_abc');
    await clearToken(stores);
    expect(await loadToken(stores)).toBeNull();
  });
});

describe('me.login', () => {
  it('round-trips the login', async () => {
    const { local } = makeStores();
    expect(await loadMeLogin(local)).toBeNull();
    await saveMeLogin(local, 'torvalds');
    expect(await loadMeLogin(local)).toBe('torvalds');
  });
});
