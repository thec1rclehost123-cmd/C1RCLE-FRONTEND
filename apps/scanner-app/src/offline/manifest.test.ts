import { describe, expect, it } from '@jest/globals';

import { loadManifest } from './manifest';
import { EVENT_ID, signedManifest } from './testHelpers';

const NOW = 1_700_000_000_000;
const base = () => signedManifest({ tickets: [{ id: 'ENT-1', seats: 2 }], signedAtMs: NOW });

describe('loadManifest', () => {
  it('accepts a correctly signed manifest and indexes it by ticket', () => {
    const result = loadManifest({ raw: base(), expectedEventId: EVENT_ID, nowMs: NOW + 1000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.manifest.entries.get('ENT-1')?.seatsRemaining).toBe(2);
    expect(result.manifest.expiresAtMs).toBe(NOW + 12 * 3600 * 1000);
  });

  it('refuses a manifest for another event', () => {
    expect(loadManifest({ raw: base(), expectedEventId: 'evt_other', nowMs: NOW })).toEqual({
      ok: false,
      reason: 'wrong_event',
    });
  });

  it('refuses any edit to the signed content', () => {
    const edited = base();
    const first = edited.manifest[0];
    if (first === undefined) throw new Error('fixture has a ticket');
    first.seatsRemaining = 9; // the device cannot grant itself seats
    expect(loadManifest({ raw: edited, expectedEventId: EVENT_ID, nowMs: NOW })).toEqual({
      ok: false,
      reason: 'bad_signature',
    });
  });

  it('refuses a ticket smuggled into a signed manifest', () => {
    const edited = base();
    edited.manifest.push({ ...edited.manifest[0], entitlementId: 'ENT-extra' } as never);
    expect(loadManifest({ raw: edited, expectedEventId: EVENT_ID, nowMs: NOW }).ok).toBe(false);
  });

  it('refuses a different signing key than the one pinned for the event', () => {
    expect(
      loadManifest({
        raw: base(),
        expectedEventId: EVENT_ID,
        nowMs: NOW,
        pinnedKeyId: 'older-key',
      }),
    ).toEqual({ ok: false, reason: 'key_changed' });
    expect(
      loadManifest({
        raw: base(),
        expectedEventId: EVENT_ID,
        nowMs: NOW,
        pinnedKeyId: 'test-key-1',
      }).ok,
    ).toBe(true);
  });

  it('refuses a manifest that has already expired', () => {
    const result = loadManifest({
      raw: base(),
      expectedEventId: EVENT_ID,
      nowMs: NOW + 13 * 3600 * 1000,
    });
    expect(result).toEqual({ ok: false, reason: 'already_expired' });
  });

  it('refuses an unknown version and malformed input without throwing', () => {
    expect(
      loadManifest({ raw: { ...base(), version: 2 }, expectedEventId: EVENT_ID, nowMs: NOW }),
    ).toEqual({ ok: false, reason: 'unsupported_version' });
    for (const raw of [null, undefined, 'x', 42, {}, { version: 1 }]) {
      expect(loadManifest({ raw, expectedEventId: EVENT_ID, nowMs: NOW })).toEqual({
        ok: false,
        reason: 'malformed',
      });
    }
  });
});
