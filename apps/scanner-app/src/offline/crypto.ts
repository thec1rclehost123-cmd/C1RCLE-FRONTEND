import { ed25519 } from '@noble/curves/ed25519.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

/**
 * Device-side verification for offline door scanning. This mirrors, byte for
 * byte, `offline-ticket-crypto.ts` in C1RCLE-BACKEND (see
 * docs/operations/offline-scanning.md there). The known-answer vectors in
 * `crypto.test.ts` are the shared contract: if they stop passing the device and
 * the server no longer agree about which tickets are genuine.
 *
 * Nothing here holds or derives the server's master secret. The device only ever
 * has the per-ticket keys it was handed in a signed manifest.
 */

/** Rotating-QR window, in seconds. */
export const MAGIC_WINDOW_SEC = 30;

export function windowStartFor(atMs: number): number {
  return Math.floor(atMs / 1000 / MAGIC_WINDOW_SEC) * MAGIC_WINDOW_SEC;
}

export interface ParsedRotatingQr {
  entitlementId: string;
  /** `null` when the window field is not an integer. */
  windowStart: number | null;
  signature: string;
}

/**
 * Splits `id:window:signature`. `null` means "not a rotating code" (a bare id),
 * which can never be verified offline.
 */
export function parseRotatingQr(payload: string): ParsedRotatingQr | null {
  const parts = payload.split(':');
  if (parts.length !== 3 || !parts.every((p) => p.length > 0)) return null;
  const [entitlementId, windowStr, signature] = parts as [string, string, string];
  const windowStart = Number.parseInt(windowStr, 10);
  return {
    entitlementId,
    windowStart: Number.isFinite(windowStart) ? windowStart : null,
    signature,
  };
}

function hmacHex(keyHex: string, message: string): string {
  return bytesToHex(hmac(sha256, utf8ToBytes(keyHex), utf8ToBytes(message)));
}

/**
 * Constant-time on equal-length strings. The comparison folds every character
 * instead of returning at the first difference.
 */
export function constantTimeEquals(candidate: string, expected: string): boolean {
  if (candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i += 1) {
    diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Checks a rotating QR against a ticket key as of `atMs` (the device clock when
 * scanning). Same rule as the server: the signature covers the claimed window or
 * the one before it, and the claimed window is within two windows of `atMs`.
 */
export function checkRotatingQr(args: {
  ticketKey: string;
  parsed: ParsedRotatingQr;
  atMs: number;
}): boolean {
  const { ticketKey, parsed, atMs } = args;
  if (parsed.windowStart === null) return false;
  const current = constantTimeEquals(
    parsed.signature,
    hmacHex(ticketKey, `${parsed.entitlementId}:${String(parsed.windowStart)}`),
  );
  const previous = constantTimeEquals(
    parsed.signature,
    hmacHex(ticketKey, `${parsed.entitlementId}:${String(parsed.windowStart - MAGIC_WINDOW_SEC)}`),
  );
  if (!current && !previous) return false;
  return Math.abs(windowStartFor(atMs) - parsed.windowStart) <= MAGIC_WINDOW_SEC * 2;
}

// ── manifest signature ──────────────────────────────────────────────────────

export interface ManifestSigningInput {
  eventId: string;
  signedAt: string;
  expiresAt: string;
  entries: readonly {
    entitlementId: string;
    validFrom: string;
    validTo: string;
    seatsRemaining: number;
    ticketKey: string;
  }[];
}

/** The exact bytes the server signed. Entries sort by id (plain string compare). */
export function manifestSigningBytes(input: ManifestSigningInput): Uint8Array {
  const lines = [...input.entries]
    .sort((a, b) =>
      a.entitlementId < b.entitlementId ? -1 : a.entitlementId > b.entitlementId ? 1 : 0,
    )
    .map(
      (e) =>
        `${e.entitlementId}|${e.validFrom}|${e.validTo}|${String(e.seatsRemaining)}|${e.ticketKey}\n`,
    );
  const digest = bytesToHex(sha256(utf8ToBytes(lines.join(''))));
  return utf8ToBytes(
    `c1rcle-offline-manifest-v1\n${input.eventId}\n${input.signedAt}\n${input.expiresAt}\n${digest}`,
  );
}

function base64ToBytes(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** `false` (never a throw) for any malformed key, signature or input. */
export function verifyManifestSignature(
  publicKeyBase64: string,
  input: ManifestSigningInput,
  signatureBase64: string,
): boolean {
  try {
    return ed25519.verify(
      base64ToBytes(signatureBase64),
      manifestSigningBytes(input),
      base64ToBytes(publicKeyBase64),
    );
  } catch {
    return false;
  }
}
