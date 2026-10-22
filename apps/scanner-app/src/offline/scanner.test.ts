import { beforeEach, describe, expect, it } from '@jest/globals';

import { DUPLICATE_READ_MS } from './decision';
import { loadManifest } from './manifest';
import { OfflineScanLog } from './scanLog';
import { OfflineScanner } from './scanner';
import { EVENT_ID, MemoryStore, qrFor, signedManifest, ticketKeyFor } from './testHelpers';

import type { VerifiedManifest } from './manifest';

const T0 = 1_700_000_000_000;
const SEC = 1000;

let log: OfflineScanLog;
let scanner: OfflineScanner;
let manifest: VerifiedManifest;
let counter = 0;

async function setup(tickets: { id: string; seats?: number }[], ttlMs?: number): Promise<void> {
  const loaded = loadManifest({
    raw: signedManifest({ tickets, signedAtMs: T0, ...(ttlMs !== undefined ? { ttlMs } : {}) }),
    expectedEventId: EVENT_ID,
    nowMs: T0,
  });
  if (!loaded.ok) throw new Error(`fixture manifest rejected: ${loaded.reason}`);
  manifest = loaded.manifest;
  log = new OfflineScanLog(new MemoryStore(), 'scans');
  await log.load();
  scanner = new OfflineScanner(manifest, log, 'device_1', () => `scan-${String((counter += 1))}`);
}

beforeEach(() => {
  counter = 0;
});

describe('offline admission', () => {
  it('admits a genuine fresh code and records it for sync', async () => {
    await setup([{ id: 'ENT-1' }]);
    const decision = await scanner.scan(qrFor('ENT-1', T0 + 10 * SEC), T0 + 10 * SEC);
    expect(decision).toEqual({ admitted: true, entitlementId: 'ENT-1', seatsLeft: 0 });
    expect(log.pending()).toHaveLength(1);
    expect(log.pending()[0]).toMatchObject({ entitlementId: 'ENT-1', deviceId: 'device_1' });
  });

  it('refuses a bare ticket id: it carries no signature to verify', async () => {
    await setup([{ id: 'ENT-1' }]);
    expect(await scanner.scan('ENT-1', T0 + SEC)).toEqual({
      admitted: false,
      reason: 'not_rotating_code',
    });
    expect(log.pending()).toHaveLength(0);
  });

  it('refuses a forged code, a code for another ticket key, and a stale screenshot', async () => {
    await setup([{ id: 'ENT-1' }]);
    const forged = qrFor('ENT-1', T0 + 5 * SEC, ticketKeyFor('someone-else'));
    expect(await scanner.scan(forged, T0 + 5 * SEC)).toEqual({
      admitted: false,
      reason: 'invalid_signature',
    });
    const screenshot = qrFor('ENT-1', T0 + 5 * SEC);
    expect(await scanner.scan(screenshot, T0 + 600 * SEC)).toEqual({
      admitted: false,
      reason: 'invalid_signature',
    });
    expect(log.pending()).toHaveLength(0);
  });

  it('refuses a ticket that is not in the manifest', async () => {
    await setup([{ id: 'ENT-1' }]);
    expect(await scanner.scan(qrFor('ENT-new', T0 + SEC), T0 + SEC)).toEqual({
      admitted: false,
      reason: 'not_in_manifest',
    });
  });

  it('refuses everything once the manifest has expired, and when the clock is behind it', async () => {
    await setup([{ id: 'ENT-1' }], 60 * SEC);
    const late = T0 + 61 * SEC;
    expect(await scanner.scan(qrFor('ENT-1', late), late)).toEqual({
      admitted: false,
      reason: 'manifest_expired',
    });
    const early = T0 - 3600 * SEC;
    expect(await scanner.scan(qrFor('ENT-1', early), early)).toEqual({
      admitted: false,
      reason: 'clock_behind',
    });
  });
});

describe('seat accounting', () => {
  it('admits a one-seat ticket once only', async () => {
    await setup([{ id: 'ENT-1', seats: 1 }]);
    const first = T0 + 10 * SEC;
    const second = first + 10 * SEC;
    expect((await scanner.scan(qrFor('ENT-1', first), first)).admitted).toBe(true);
    expect(await scanner.scan(qrFor('ENT-1', second), second)).toEqual({
      admitted: false,
      reason: 'already_used',
    });
  });

  it('admits a couple ticket twice, then refuses the third', async () => {
    await setup([{ id: 'ENT-couple', seats: 2 }]);
    const times = [T0 + 10 * SEC, T0 + 40 * SEC, T0 + 70 * SEC];
    const out = [];
    for (const at of times) out.push(await scanner.scan(qrFor('ENT-couple', at), at));
    expect(out.map((d) => d.admitted)).toEqual([true, true, false]);
    expect(out[0]).toMatchObject({ seatsLeft: 1 });
    expect(out[1]).toMatchObject({ seatsLeft: 0 });
    expect(out[2]).toEqual({ admitted: false, reason: 'already_used' });
  });

  it('treats the same code read twice in a moment as one scan, not a second guest', async () => {
    await setup([{ id: 'ENT-couple', seats: 2 }]);
    const code = qrFor('ENT-couple', T0 + 10 * SEC);
    expect((await scanner.scan(code, T0 + 10 * SEC)).admitted).toBe(true);
    expect(await scanner.scan(code, T0 + 10 * SEC + DUPLICATE_READ_MS - 1)).toEqual({
      admitted: false,
      reason: 'duplicate_read',
    });
    expect(log.pending()).toHaveLength(1);
    // The second guest, a few seconds later, is admitted.
    expect((await scanner.scan(code, T0 + 10 * SEC + DUPLICATE_READ_MS + 500)).admitted).toBe(true);
  });

  it('never lets two simultaneous reads both take the last seat', async () => {
    await setup([{ id: 'ENT-1', seats: 1 }]);
    const at = T0 + 10 * SEC;
    const results = await Promise.all([
      scanner.scan(qrFor('ENT-1', at), at + 5000),
      scanner.scan(qrFor('ENT-1', at + 10 * SEC), at + 15 * SEC),
    ]);
    expect(results.filter((r) => r.admitted)).toHaveLength(1);
    expect(log.pending()).toHaveLength(1);
  });

  it('keeps counting a seat after it has synced, so it cannot be admitted twice', async () => {
    await setup([{ id: 'ENT-1', seats: 1 }]);
    const first = T0 + 10 * SEC;
    expect((await scanner.scan(qrFor('ENT-1', first), first)).admitted).toBe(true);
    await log.markSynced(log.pending().map((r) => r.id));
    expect(log.pending()).toHaveLength(0);
    const later = first + 60 * SEC;
    expect(await scanner.scan(qrFor('ENT-1', later), later)).toEqual({
      admitted: false,
      reason: 'already_used',
    });
  });

  it('forgets settled seats only when a fresh manifest replaces the old one', async () => {
    await setup([{ id: 'ENT-1', seats: 1 }]);
    const first = T0 + 10 * SEC;
    await scanner.scan(qrFor('ENT-1', first), first);
    const [only] = log.pending();
    if (only === undefined) throw new Error('one admission recorded');
    await log.markSynced([only.id]);
    await scanner.scan(qrFor('ENT-1', first + 60 * SEC), first + 60 * SEC); // refused
    await log.settleForNewManifest();
    expect(log.seatsUsed('ENT-1')).toBe(0);
  });
});
