import { ed25519 } from '@noble/curves/ed25519.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import { manifestSigningBytes, windowStartFor } from './crypto';

import type { OfflineManifest } from './manifest';
import type { KeyValueStore } from './scanLog';

/** Test-only helpers: they stand in for the server so the device code can be driven end to end. */

const SEED = new Uint8Array(32).fill(7);
export const TEST_PUBLIC_KEY_BASE64 = Buffer.from(ed25519.getPublicKey(SEED)).toString('base64');
export const TEST_KEY_ID = 'test-key-1';
export const EVENT_ID = 'evt_1';

export function ticketKeyFor(id: string): string {
  return bytesToHex(sha256(utf8ToBytes(`test-ticket-key|${id}`)));
}

/** Builds the rotating QR the server would show, for the window containing `atMs`. */
export function qrFor(id: string, atMs: number, key: string = ticketKeyFor(id)): string {
  const windowStart = windowStartFor(atMs);
  const signature = bytesToHex(
    hmac(sha256, utf8ToBytes(key), utf8ToBytes(`${id}:${String(windowStart)}`)),
  );
  return `${id}:${String(windowStart)}:${signature}`;
}

export interface TestManifestOptions {
  tickets: { id: string; seats?: number }[];
  signedAtMs: number;
  ttlMs?: number;
  eventId?: string;
  keyId?: string;
}

/** A correctly signed manifest, as the gateway would return it. */
export function signedManifest(options: TestManifestOptions): OfflineManifest {
  const signedAt = new Date(options.signedAtMs).toISOString();
  const expiresAt = new Date(
    options.signedAtMs + (options.ttlMs ?? 12 * 3600 * 1000),
  ).toISOString();
  const eventId = options.eventId ?? EVENT_ID;
  const manifest = options.tickets.map((t) => ({
    entitlementId: t.id,
    validFrom: signedAt,
    validTo: expiresAt,
    seatsRemaining: t.seats ?? 1,
    ticketKey: ticketKeyFor(t.id),
  }));
  const signature = ed25519.sign(
    manifestSigningBytes({ eventId, signedAt, expiresAt, entries: manifest }),
    SEED,
  );
  return {
    version: 1,
    eventId,
    manifest,
    signedAt,
    expiresAt,
    keyId: options.keyId ?? TEST_KEY_ID,
    publicKey: TEST_PUBLIC_KEY_BASE64,
    manifestSignature: Buffer.from(signature).toString('base64'),
  };
}

export class MemoryStore implements KeyValueStore {
  readonly data = new Map<string, string>();
  writes = 0;
  get(key: string): Promise<string | null> {
    return Promise.resolve(this.data.get(key) ?? null);
  }
  set(key: string, value: string): Promise<void> {
    this.writes += 1;
    this.data.set(key, value);
    return Promise.resolve();
  }
}
