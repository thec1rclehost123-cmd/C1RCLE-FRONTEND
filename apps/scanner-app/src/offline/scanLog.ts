import { z } from 'zod';

/** Minimal async key-value storage. The app supplies a real, persistent one. */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

const recordSchema = z.object({
  id: z.string().min(1),
  payload: z.string().min(1),
  entitlementId: z.string().min(1),
  scannedAt: z.iso.datetime(),
  deviceId: z.string().min(1),
  /** `pending` = server has not decided; `synced` = accepted; `conflict` = refused. */
  status: z.enum(['pending', 'synced', 'conflict']),
  /** Set when the server refused the scan at sync (`already_used`, `void_ticket`, ...). */
  conflictReason: z.string().nullable(),
  /** The operator has seen this conflict. It still counts against the seat budget. */
  acknowledged: z.boolean(),
});
export type OfflineScanRecord = z.infer<typeof recordSchema>;

const fileSchema = z.object({ version: z.literal(1), records: z.array(recordSchema) });

/**
 * What the device admitted while it had no signal.
 *
 * Two jobs, and the second is the easy one to get wrong:
 * 1. Remember every admission until the server has decided it (`pending`).
 * 2. Keep counting every admission against the manifest's seat budget even after
 *    it has synced. The manifest's `seatsRemaining` is frozen at signing time, so
 *    forgetting a synced admission would let the device admit the same ticket
 *    again. Settled records are only dropped when a fresh manifest replaces the
 *    old one (`settleForNewManifest`), because the fresh budget already reflects them.
 *
 * It is the only copy of un-synced scans, so every change is written before it is
 * reported, and writes are serialised so two scans in quick succession cannot lose one.
 */
export class OfflineScanLog {
  private records: OfflineScanRecord[] = [];
  private loaded = false;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly store: KeyValueStore,
    private readonly key: string,
  ) {}

  /** Loads persisted records. A corrupt file is surfaced, never silently dropped. */
  async load(): Promise<void> {
    const raw = await this.store.get(this.key);
    if (raw === null) {
      this.records = [];
    } else {
      const parsed = fileSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) throw new Error('Offline scan log is corrupt; do not discard it');
      this.records = parsed.data.records;
    }
    this.loaded = true;
  }

  private assertLoaded(): void {
    if (!this.loaded) throw new Error('OfflineScanLog.load() must be called first');
  }

  /** Runs `change` then persists, in order with every other change. */
  private mutate(change: () => void): Promise<void> {
    this.assertLoaded();
    const run = this.queue.then(async () => {
      change();
      await this.store.set(this.key, JSON.stringify({ version: 1, records: this.records }));
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  all(): readonly OfflineScanRecord[] {
    this.assertLoaded();
    return this.records;
  }

  pending(): OfflineScanRecord[] {
    return this.all().filter((r) => r.status === 'pending');
  }

  /** Conflicts the operator has not yet seen. */
  openConflicts(): OfflineScanRecord[] {
    return this.all().filter((r) => r.status === 'conflict' && !r.acknowledged);
  }

  /** Every seat this device has admitted for a ticket under the current manifest. */
  seatsUsed(entitlementId: string): number {
    return this.all().filter((r) => r.entitlementId === entitlementId).length;
  }

  /** The newest scan time for a payload, for duplicate-read suppression. */
  lastScannedAtMs(payload: string): number | null {
    let latest: number | null = null;
    for (const r of this.all()) {
      if (r.payload !== payload) continue;
      const at = Date.parse(r.scannedAt);
      if (latest === null || at > latest) latest = at;
    }
    return latest;
  }

  append(
    record: Omit<OfflineScanRecord, 'status' | 'conflictReason' | 'acknowledged'>,
  ): Promise<void> {
    return this.mutate(() => {
      this.records.push({
        ...record,
        status: 'pending',
        conflictReason: null,
        acknowledged: false,
      });
    });
  }

  markSynced(ids: readonly string[]): Promise<void> {
    const done = new Set(ids);
    return this.mutate(() => {
      this.records = this.records.map((r) => (done.has(r.id) ? { ...r, status: 'synced' } : r));
    });
  }

  /** Keeps records the server refused, so the operator learns who got in on a bad ticket. */
  markConflicts(reasons: ReadonlyMap<string, string>): Promise<void> {
    return this.mutate(() => {
      this.records = this.records.map((r) => {
        const reason = reasons.get(r.id);
        return reason === undefined ? r : { ...r, status: 'conflict', conflictReason: reason };
      });
    });
  }

  acknowledge(ids: readonly string[]): Promise<void> {
    const seen = new Set(ids);
    return this.mutate(() => {
      this.records = this.records.map((r) => (seen.has(r.id) ? { ...r, acknowledged: true } : r));
    });
  }

  /**
   * Call after accepting a freshly fetched manifest. Its `seatsRemaining` already
   * reflects everything the server has settled, so settled records stop counting;
   * `pending` records are kept because the server has not seen them yet.
   */
  settleForNewManifest(): Promise<void> {
    return this.mutate(() => {
      this.records = this.records.filter((r) => r.status === 'pending');
    });
  }
}
