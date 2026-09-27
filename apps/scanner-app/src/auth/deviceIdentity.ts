import * as Crypto from 'expo-crypto';

import { deleteStoredItem, getStoredItem, setStoredItem } from '@/storage/secureStorage';

/**
 * Device identity: opaque, client-generated once on first launch, never
 * hardware-derived (`docs/api-contracts/scanner-app.md` §5). Persisted via
 * `@/storage/secureStorage` — Keychain/Keystore on a handset, and on the web
 * target the `device` scope, since SecureStore has no browser implementation.
 * Never AsyncStorage.
 */

const DEVICE_ID_KEY = 'c1rcle_scanner_device_id';
const DEVICE_NAME_KEY = 'c1rcle_scanner_device_name';

function randomDeviceId(): string {
  const bytes = Crypto.getRandomBytes(16);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `scanner_${hex}`;
}

/** Returns the persisted device id, generating and storing one on first call. */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getStoredItem(DEVICE_ID_KEY);
  if (existing !== null) {
    return existing;
  }
  const created = randomDeviceId();
  await setStoredItem(DEVICE_ID_KEY, created);
  return created;
}

export async function getStoredDeviceName(): Promise<string | null> {
  return getStoredItem(DEVICE_NAME_KEY);
}

export async function setStoredDeviceName(name: string): Promise<void> {
  await setStoredItem(DEVICE_NAME_KEY, name);
}

export async function isDevicePaired(): Promise<boolean> {
  const [id, name] = await Promise.all([getStoredItem(DEVICE_ID_KEY), getStoredItem(DEVICE_NAME_KEY)]);
  return id !== null && name !== null;
}

/** Clears the local pairing record — used after a 403 (device unbound by a manager). */
export async function clearDevicePairing(): Promise<void> {
  await deleteStoredItem(DEVICE_NAME_KEY);
  // Deliberately keep DEVICE_ID_KEY: the opaque id identifies the physical
  // handset, not the pairing — re-registering reuses the same id, per the
  // contract's "generate once, reuse forever" rule.
}
