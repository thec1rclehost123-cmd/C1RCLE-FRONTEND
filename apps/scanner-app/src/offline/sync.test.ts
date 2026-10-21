import { describe, expect, it } from '@jest/globals';

import { OfflineScanLog } from './scanLog';
import { SYNC_BATCH_SIZE, idempotencyKeyFor, syncOfflineScans } from './sync';
import { EVENT_ID, MemoryStore } from './testHelpers';

import type { OfflineSyncRequest, OfflineSyncResponse, OfflineSyncTransport } from './sync';

const T0 = Date.UTC(2026, 9, 18, 10, 0, 0);

async function newLog(store = new MemoryStore()): Promise<OfflineScanLog> {
  const log = new OfflineScanLog(store, 'scans');
  await log.load();
  return log;
}

async function addScan(
  log: OfflineScanLog,
  n: number,
  payload = `P-${String(n)}`,
  ent = `ENT-${String(n)}`,
) {
  await log.append({
    id: `scan-${String(n)}`,
    payload,
    entitlementId: ent,
    scannedAt: new Date(T0 + n * 1000).toISOString(),
    deviceId: 'device_1',
  });
}

function transportOf(
  respond: (req: OfflineSyncRequest) => OfflineSyncResponse | Error,
  calls: { request: OfflineSyncRequest; key: string }[] = [],
): OfflineSyncTransport {
  return (request, key) => {
    calls.push({ request, key });
    const out = respond(request);
    return out instanceof Error ? Promise.reject(out) : Promise.resolve(out);
  };
}

describe('syncOfflineScans', () => {
  it('sends pending scans oldest first and marks the accepted ones synced', async () => {
    const log = await newLog();
    await addScan(log, 2);
    await addScan(log, 1);
    const calls: { request: OfflineSyncRequest; key: string }[] = [];
    const summary = await syncOfflineScans({
      log,
      eventId: EVENT_ID,
      transport: transportOf((req) => ({ synced: req.scans.length, conflicts: [] }), calls),
    });
    expect(summary).toEqual({ accepted: 2, conflicts: 0, remaining: 0, error: null });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.request.scans.map((s) => s.payload)).toEqual(['P-1', 'P-2']);
    expect(log.all().map((r) => r.status)).toEqual(['synced', 'synced']);
  });

  it('keeps refused scans as conflicts with the server reason, for the operator', async () => {
    const log = await newLog();
    await addScan(log, 1);
    await addScan(log, 2);
    const summary = await syncOfflineScans({
      log,
      eventId: EVENT_ID,
      transport: transportOf(() => ({
        synced: 1,
        conflicts: [{ payload: 'P-2', reason: 'already_used' }],
      })),
    });
    expect(summary).toMatchObject({ accepted: 1, conflicts: 1, remaining: 0 });
    expect(log.openConflicts().map((r) => [r.id, r.conflictReason])).toEqual([
      ['scan-2', 'already_used'],
    ]);
    await log.acknowledge(['scan-2']);
    expect(log.openConflicts()).toHaveLength(0);
    // Acknowledging a conflict does not give the seat back.
    expect(log.seatsUsed('ENT-2')).toBe(1);
  });

  it('never drops a scan because the network failed, and resumes later', async () => {
    const store = new MemoryStore();
    const log = await newLog(store);
    await addScan(log, 1);
    await addScan(log, 2);
    const failed = await syncOfflineScans({
      log,
      eventId: EVENT_ID,
      transport: transportOf(() => new Error('Network request failed')),
    });
    expect(failed).toEqual({
      accepted: 0,
      conflicts: 0,
      remaining: 2,
      error: 'Network request failed',
    });

    // The app is killed and restarted: the scans are still there.
    const reopened = await newLog(store);
    expect(reopened.pending()).toHaveLength(2);
    const retry = await syncOfflineScans({
      log: reopened,
      eventId: EVENT_ID,
      transport: transportOf((req) => ({ synced: req.scans.length, conflicts: [] })),
    });
    expect(retry).toMatchObject({ accepted: 2, remaining: 0, error: null });
  });

  it('refuses the later of two scans of the same payload (a couple) when only one seat remained', async () => {
    const log = await newLog();
    await addScan(log, 1, 'P-couple', 'ENT-couple');
    await addScan(log, 2, 'P-couple', 'ENT-couple');
    await syncOfflineScans({
      log,
      eventId: EVENT_ID,
      transport: transportOf(() => ({
        synced: 1,
        conflicts: [{ payload: 'P-couple', reason: 'already_used' }],
      })),
    });
    const byId = Object.fromEntries(log.all().map((r) => [r.id, r.status]));
    expect(byId).toEqual({ 'scan-1': 'synced', 'scan-2': 'conflict' });
  });

  it('batches at the gateway limit and uses a stable key per batch', async () => {
    const log = await newLog();
    for (let n = 1; n <= SYNC_BATCH_SIZE + 3; n += 1) await addScan(log, n);
    const calls: { request: OfflineSyncRequest; key: string }[] = [];
    const summary = await syncOfflineScans({
      log,
      eventId: EVENT_ID,
      transport: transportOf((req) => ({ synced: req.scans.length, conflicts: [] }), calls),
    });
    expect(summary).toMatchObject({ accepted: SYNC_BATCH_SIZE + 3, remaining: 0 });
    expect(calls.map((c) => c.request.scans.length)).toEqual([SYNC_BATCH_SIZE, 3]);
    expect(calls[0]?.key).not.toBe(calls[1]?.key);
    // A retry of the same batch carries the same key, so the server can dedupe it.
    const first = log.all().slice(0, 3);
    expect(idempotencyKeyFor(first)).toBe(idempotencyKeyFor(first));
    expect(idempotencyKeyFor(first)).toMatch(/^offline-sync-[0-9a-f]{32}$/);
  });

  it('stops at the first failed batch and keeps the rest pending', async () => {
    const log = await newLog();
    for (let n = 1; n <= SYNC_BATCH_SIZE + 2; n += 1) await addScan(log, n);
    let call = 0;
    const summary = await syncOfflineScans({
      log,
      eventId: EVENT_ID,
      transport: transportOf((req) => {
        call += 1;
        return call === 1 ? { synced: req.scans.length, conflicts: [] } : new Error('timeout');
      }),
    });
    expect(summary).toMatchObject({ accepted: SYNC_BATCH_SIZE, remaining: 2, error: 'timeout' });
  });
});

describe('OfflineScanLog', () => {
  it('survives a restart and refuses to silently discard a corrupt file', async () => {
    const store = new MemoryStore();
    const log = await newLog(store);
    await addScan(log, 1);
    expect((await newLog(store)).pending()).toHaveLength(1);

    store.data.set('scans', '{"version":1,"records":[{"nope":true}]}');
    await expect(newLog(store)).rejects.toThrow(/corrupt/);
  });

  it('writes every change before it resolves and serialises concurrent writes', async () => {
    const store = new MemoryStore();
    const log = await newLog(store);
    await Promise.all([addScan(log, 1), addScan(log, 2), addScan(log, 3)]);
    expect(log.pending()).toHaveLength(3);
    expect((await newLog(store)).pending()).toHaveLength(3);
  });

  it('refuses use before load()', () => {
    const log = new OfflineScanLog(new MemoryStore(), 'scans');
    expect(() => log.pending()).toThrow(/load/);
  });
});
