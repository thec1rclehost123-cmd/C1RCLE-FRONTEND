import { z } from 'zod';

import { verifyManifestSignature } from './crypto';

/**
 * The offline manifest as the gateway sends it (`GET /door/offline-manifest`).
 * Mirrors `offlineManifestResponseSchema` in @c1rcle/contracts; kept local
 * because this app deliberately depends only on `@c1rcle/api-client`.
 */
export const offlineManifestSchema = z.object({
  version: z.literal(1),
  eventId: z.string().min(1),
  manifest: z.array(
    z.object({
      entitlementId: z.string().min(1),
      validFrom: z.iso.datetime(),
      validTo: z.iso.datetime(),
      seatsRemaining: z.number().int().positive(),
      ticketKey: z.string().regex(/^[0-9a-f]{64}$/),
    }),
  ),
  signedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  keyId: z.string().min(1),
  publicKey: z.string().min(1),
  manifestSignature: z.string().min(1),
});
export type OfflineManifest = z.infer<typeof offlineManifestSchema>;
export type OfflineManifestEntry = OfflineManifest['manifest'][number];

export type ManifestRejection =
  | 'malformed'
  | 'unsupported_version'
  | 'wrong_event'
  | 'bad_signature'
  | 'key_changed'
  | 'already_expired';

export type ManifestLoadResult =
  { ok: true; manifest: VerifiedManifest } | { ok: false; reason: ManifestRejection };

/** A manifest that has passed every check, indexed for O(1) lookup per scan. */
export interface VerifiedManifest {
  readonly eventId: string;
  readonly signedAtMs: number;
  readonly expiresAtMs: number;
  readonly keyId: string;
  readonly publicKey: string;
  readonly entries: ReadonlyMap<string, OfflineManifestEntry>;
}

/**
 * Validates a manifest before the device trusts a single ticket key in it.
 *
 * `pinnedKeyId` is the key id remembered for this event from an earlier fetch.
 * A different key mid-event is refused rather than silently adopted, because
 * the public key arrives in the same response as the manifest: the signature
 * proves the stored bytes were not edited, the pin proves the server did not
 * change identity underneath the device.
 */
export function loadManifest(args: {
  raw: unknown;
  expectedEventId: string;
  nowMs: number;
  pinnedKeyId?: string | null;
}): ManifestLoadResult {
  const rawVersion =
    typeof args.raw === 'object' && args.raw !== null
      ? (args.raw as { version?: unknown }).version
      : undefined;
  if (rawVersion !== undefined && rawVersion !== 1) {
    return { ok: false, reason: 'unsupported_version' };
  }
  const parsed = offlineManifestSchema.safeParse(args.raw);
  if (!parsed.success) return { ok: false, reason: 'malformed' };
  const m = parsed.data;
  if (m.eventId !== args.expectedEventId) return { ok: false, reason: 'wrong_event' };
  if (args.pinnedKeyId && args.pinnedKeyId !== m.keyId) {
    return { ok: false, reason: 'key_changed' };
  }
  const valid = verifyManifestSignature(
    m.publicKey,
    {
      eventId: m.eventId,
      signedAt: m.signedAt,
      expiresAt: m.expiresAt,
      entries: m.manifest,
    },
    m.manifestSignature,
  );
  if (!valid) return { ok: false, reason: 'bad_signature' };
  const expiresAtMs = Date.parse(m.expiresAt);
  if (expiresAtMs <= args.nowMs) return { ok: false, reason: 'already_expired' };
  return {
    ok: true,
    manifest: {
      eventId: m.eventId,
      signedAtMs: Date.parse(m.signedAt),
      expiresAtMs,
      keyId: m.keyId,
      publicKey: m.publicKey,
      entries: new Map(m.manifest.map((e) => [e.entitlementId, e])),
    },
  };
}
