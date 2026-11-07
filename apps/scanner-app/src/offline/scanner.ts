import { parseRotatingQr } from './crypto';
import { decideOfflineScan } from './decision';

import type { OfflineDecision } from './decision';
import type { VerifiedManifest } from './manifest';
import type { OfflineScanLog } from './scanLog';

/**
 * Admits tickets with no signal: verifies the code against the manifest, counts
 * the seat against the manifest's budget, and records the admission so it can be
 * synced later. This is the only place an offline admission is created.
 *
 * Scans run strictly one at a time. Two reads of the same couple ticket arriving
 * together must not both see "one seat left"; the decision and the write that
 * consumes the seat have to be a single step.
 */
export class OfflineScanner {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly manifest: VerifiedManifest,
    private readonly log: OfflineScanLog,
    private readonly deviceId: string,
    private readonly newId: () => string,
  ) {}

  scan(payload: string, nowMs: number): Promise<OfflineDecision> {
    const run = this.queue.then(() => this.decideAndRecord(payload, nowMs));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async decideAndRecord(payload: string, nowMs: number): Promise<OfflineDecision> {
    const parsed = parseRotatingQr(payload);
    const decision = decideOfflineScan({
      manifest: this.manifest,
      payload,
      nowMs,
      seatsUsed: parsed === null ? 0 : this.log.seatsUsed(parsed.entitlementId),
      lastAdmittedPayloadAtMs: this.log.lastScannedAtMs(payload),
    });
    if (decision.admitted) {
      await this.log.append({
        id: this.newId(),
        payload,
        entitlementId: decision.entitlementId,
        scannedAt: new Date(nowMs).toISOString(),
        deviceId: this.deviceId,
      });
    }
    return decision;
  }
}
