import { checkRotatingQr, parseRotatingQr } from './crypto';

import type { VerifiedManifest } from './manifest';

/**
 * Why the device refused a scan on its own. Distinct from the server's deny
 * reasons because these are decisions taken without the server: an offline
 * refusal is always final for that scan (nothing is queued for sync).
 */
export type OfflineDenyReason =
  /** A bare ticket id: it carries no signature, so it cannot be verified offline. */
  | 'not_rotating_code'
  | 'invalid_signature'
  /** Not in this device's manifest: issued after it was signed, or another event. */
  | 'not_in_manifest'
  | 'manifest_expired'
  /** The device clock is before the manifest was signed, so its clock cannot be trusted. */
  | 'clock_behind'
  | 'already_used'
  /** The same code read twice in a moment: one admission, not two. */
  | 'duplicate_read';

export type OfflineDecision =
  | { admitted: true; entitlementId: string; seatsLeft: number }
  | { admitted: false; reason: OfflineDenyReason };

/** The same payload read again inside this window is one scan, not a second guest. */
export const DUPLICATE_READ_MS = 2000;
/** Allowed amount by which the device clock may trail the manifest's signing time. */
export const CLOCK_BEHIND_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * The pure offline admission decision. It never writes anything: the caller
 * records an admitted scan, which is what makes `seatsUsed` increase.
 *
 * `seatsUsed` is how many seats this device has already admitted offline for the
 * ticket; the manifest's `seatsRemaining` is the budget at signing time.
 */
export function decideOfflineScan(args: {
  manifest: VerifiedManifest;
  payload: string;
  nowMs: number;
  seatsUsed: number;
  lastAdmittedPayloadAtMs: number | null;
}): OfflineDecision {
  const { manifest, payload, nowMs, seatsUsed, lastAdmittedPayloadAtMs } = args;

  if (lastAdmittedPayloadAtMs !== null && nowMs - lastAdmittedPayloadAtMs < DUPLICATE_READ_MS) {
    return { admitted: false, reason: 'duplicate_read' };
  }

  const parsed = parseRotatingQr(payload);
  if (parsed === null) return { admitted: false, reason: 'not_rotating_code' };

  if (nowMs >= manifest.expiresAtMs) return { admitted: false, reason: 'manifest_expired' };
  if (nowMs < manifest.signedAtMs - CLOCK_BEHIND_TOLERANCE_MS) {
    return { admitted: false, reason: 'clock_behind' };
  }

  const entry = manifest.entries.get(parsed.entitlementId);
  if (entry === undefined) return { admitted: false, reason: 'not_in_manifest' };

  if (!checkRotatingQr({ ticketKey: entry.ticketKey, parsed, atMs: nowMs })) {
    return { admitted: false, reason: 'invalid_signature' };
  }

  if (seatsUsed >= entry.seatsRemaining) return { admitted: false, reason: 'already_used' };
  return {
    admitted: true,
    entitlementId: entry.entitlementId,
    seatsLeft: entry.seatsRemaining - seatsUsed - 1,
  };
}
