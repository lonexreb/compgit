import { defineBackground } from 'wxt/utils/define-background';
import { createAuthStores } from '../lib/chrome-storage';
import type { BackgroundAck, ViewToBackground } from '../lib/messages';
import { clearAllContributions, refreshContributions } from '../lib/refresh';

const ALARM_NAME = 'compgit-refresh';
const PERIOD_MINUTES = 15;

export default defineBackground(() => {
  // Top-level listeners only — MV3 requires synchronous registration.

  chrome.runtime.onInstalled.addListener((details) => {
    void ensureAlarm();
    if (details.reason === 'install') {
      chrome.runtime.openOptionsPage();
    }
  });

  chrome.runtime.onStartup.addListener(() => {
    void ensureAlarm();
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
      void refreshContributions();
    }
  });

  chrome.runtime.onMessage.addListener((message: ViewToBackground, _sender, sendResponse) => {
    switch (message.type) {
      case 'token-changed':
      case 'refresh-now':
        void handleRefresh().then(sendResponse);
        return true;
      case 'clear-cache':
        void handleClearCache().then(sendResponse);
        return true;
    }
    return false;
  });
});

async function ensureAlarm(): Promise<void> {
  const existing = await chrome.alarms.get(ALARM_NAME);
  if (!existing) {
    await chrome.alarms.create(ALARM_NAME, { periodInMinutes: PERIOD_MINUTES });
  }
}

async function handleRefresh(): Promise<BackgroundAck> {
  const outcome = await refreshContributions();
  return outcome.ok ? { ok: true } : { ok: false, message: outcome.reason };
}

async function handleClearCache(): Promise<BackgroundAck> {
  const stores = createAuthStores();
  await clearAllContributions(stores.local);
  return { ok: true };
}
