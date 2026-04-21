import type { StorageDriver } from './storage';

const TOKEN_KEY = 'auth.token';
const ME_LOGIN_KEY = 'me.login';

export interface AuthStores {
  session: StorageDriver;
  local: StorageDriver;
}

export async function loadToken(stores: AuthStores): Promise<string | null> {
  const hot = await stores.session.get<string>(TOKEN_KEY);
  if (hot) return hot;
  const cold = await stores.local.get<string>(TOKEN_KEY);
  if (cold) {
    // Prime the session store so next read is in-memory fast.
    await stores.session.set(TOKEN_KEY, cold);
  }
  return cold;
}

export async function saveToken(stores: AuthStores, token: string): Promise<void> {
  await Promise.all([stores.session.set(TOKEN_KEY, token), stores.local.set(TOKEN_KEY, token)]);
}

export async function clearToken(stores: AuthStores): Promise<void> {
  await Promise.all([stores.session.remove(TOKEN_KEY), stores.local.remove(TOKEN_KEY)]);
}

export async function loadMeLogin(local: StorageDriver): Promise<string | null> {
  return local.get<string>(ME_LOGIN_KEY);
}

export async function saveMeLogin(local: StorageDriver, login: string): Promise<void> {
  await local.set(ME_LOGIN_KEY, login);
}
