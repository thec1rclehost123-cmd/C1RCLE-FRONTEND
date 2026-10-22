import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import type { OfflineScanLog, OfflineScanRecord } from './scanLog';

/** The gateway caps one sync request at this many scans. */
export const SYNC_BATCH_SIZE = 500;

export interface OfflineSyncRequest {
  eventId: string;
  scans: { payload: string; scannedAt: string; deviceId: string }[];
}

export interface OfflineSyncResponse {
  synced: number;
  conflicts: { payload: string; reason: string }[];
}

/** Sends one batch to `POST /door/offline-sync`. Throws on any transport or HTTP failure. */
export type OfflineSyncTransport = (
  request: OfflineSyncRequest,
  idempotencyKey: string,
) => Promise<OfflineSyncResponse>;

export interface SyncSummary {
  /** Scans the server admitted. */
  accepted: number;
  /** Scans the server refused. They stay in the log for the operator. */
  conflicts: number;
  /** Scans still waiting because a batch failed to send. */
  remaining: number;
  /** Set when sending stopped early. The scans are kept and the next call resumes. */
  error: string | null;
}

/**
 * The same batch must always carry the same key, so a retry after a lost
 * response is recognised by the server instead of being applied twice.
 */
export function idempotencyKeyFor(records: readonly OfflineScanRecord[]): string {
  const ids = records.map((r) => r.id).join(',');
  return `offline-sync-${bytesToHex(sha256(utf8ToBytes(ids))).slice(0, 32)}`;
}

/**
 * Pushes pending offline scans to the server, oldest first, one batch at a time.
 *
 * A thrown error stops the run and leaves every unsent scan pending: nothing is
 * ever dropped because the network failed. The server returns conflicts by
 * payload, not by id. When the same payload appears several times in a batch
 * (a couple's two guests) the later scans are the ones counted as refused, since
 * the earlier ones claimed the seats first.
 */
export async function syncOfflineScans(args: {
  log: OfflineScanLog;
  eventId: string;
  transport: OfflineSyncTransport;
}): Promise<SyncSummary> {
  const { log, eventId, transport } = args;
  let accepted = 0;
  let conflicts = 0;

  const pending = [...log.pending()].sort(
    (a, b) => Date.parse(a.scannedAt) - Date.parse(b.scannedAt),
  );

  for (let start = 0; start < pending.length; start += SYNC_BATCH_SIZE) {
    const batch = pending.slice(start, start + SYNC_BATCH_SIZE);
    let response: OfflineSyncResponse;
    try {
      response = await transport(
        {
          eventId,
          scans: batch.map((r) => ({
            payload: r.payload,
            scannedAt: r.scannedAt,
            deviceId: r.deviceId,
          })),
        },
        idempotencyKeyFor(batch),
      );
    } catch (cause) {
      return {
        accepted,
        conflicts,
        remaining: log.pending().length,
        error: cause instanceof Error ? cause.message : 'Sync failed',
      };
    }

    const refusedByPayload = new Map<string, string[]>();
    for (const c of response.conflicts) {
      refusedByPayload.set(c.payload, [...(refusedByPayload.get(c.payload) ?? []), c.reason]);
    }

    const conflictReasons = new Map<string, string>();
    const accept: string[] = [];
    const byPayload = new Map<string, OfflineScanRecord[]>();
    for (const r of batch) byPayload.set(r.payload, [...(byPayload.get(r.payload) ?? []), r]);

    for (const [payload, records] of byPayload) {
      const reasons = refusedByPayload.get(payload) ?? [];
      const refusedCount = Math.min(reasons.length, records.length);
      const okCount = records.length - refusedCount;
      records.slice(0, okCount).forEach((r) => accept.push(r.id));
      records.slice(okCount).forEach((r, i) => {
        conflictReasons.set(r.id, reasons[i] ?? 'denied');
      });
    }

    await log.markSynced(accept);
    await log.markConflicts(conflictReasons);
    accepted += accept.length;
    conflicts += conflictReasons.size;
  }

  return { accepted, conflicts, remaining: log.pending().length, error: null };
}
