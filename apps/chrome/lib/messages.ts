/**
 * Typed message protocol between extension contexts.
 * Only one direction today: views → background worker.
 */

export type ViewToBackground =
  | { type: 'token-changed' }
  | { type: 'refresh-now' }
  | { type: 'clear-cache' };

export type BackgroundAck = { ok: true } | { ok: false; message: string };

export async function send(message: ViewToBackground): Promise<BackgroundAck> {
  try {
    const response = (await chrome.runtime.sendMessage(message)) as BackgroundAck | undefined;
    return response ?? { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return { ok: false, message };
  }
}
