import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * The app's one persistence boundary.
 *
 * `expo-secure-store` is native-only — it has no web implementation, and
 * calling it in a browser throws
 * `ExpoSecureStore.default.getValueWithKeyAsync is not a function`. Since
 * this app ships to both handsets and the web target, every caller goes
 * through here instead of importing SecureStore directly.
 *
 * On native this is Keychain/Keystore, which is what
 * `docs/api-contracts/scanner-app.md` §5 requires. **A browser has no
 * equivalent**, so the web target necessarily stores these in Web Storage,
 * which is readable by any script on the origin. The scopes below keep that
 * downgrade as small as possible:
 *
 * - `device` (localStorage): long-lived, non-secret identifiers — the opaque
 *   device id, the device name, the venue binding. Leaking these does not
 *   authorize anything on its own.
 * - `session` (sessionStorage): the scanner session token, a 12h bearer
 *   credential. Scoped to the tab so closing the browser drops it, rather
 *   than leaving a working door credential on a shared machine.
 *
 * Treat the web target as staff-supervised/preview accordingly; the handset
 * build is the one that meets the contract's storage requirement.
 */

export type StorageScope = 'device' | 'session';

interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function webStorage(scope: StorageScope): WebStorage | null {
  const global = globalThis as { localStorage?: WebStorage; sessionStorage?: WebStorage };
  // Access itself can throw when site data is blocked, so this is guarded
  // rather than assumed present.
  try {
    return (scope === 'session' ? global.sessionStorage : global.localStorage) ?? null;
  } catch {
    return null;
  }
}

export function getStoredItem(key: string, scope: StorageScope = 'device'): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return Promise.resolve(webStorage(scope)?.getItem(key) ?? null);
    } catch {
      return Promise.resolve(null);
    }
  }
  return SecureStore.getItemAsync(key);
}

export function setStoredItem(
  key: string,
  value: string,
  scope: StorageScope = 'device',
): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      webStorage(scope)?.setItem(key, value);
    } catch {
      // Private mode / blocked site data: the app must still run, it just
      // won't remember across reloads.
    }
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(key, value);
}

export function deleteStoredItem(key: string, scope: StorageScope = 'device'): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      webStorage(scope)?.removeItem(key);
    } catch {
      // See setStoredItem.
    }
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(key);
}
