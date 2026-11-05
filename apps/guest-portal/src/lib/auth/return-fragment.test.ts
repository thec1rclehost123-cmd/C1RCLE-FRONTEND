import { beforeEach, describe, expect, it, vi } from 'vitest';

import { captureGuestReturnFragment, restoreGuestReturnFragment } from './return-fragment';

const { user } = vi.hoisted((): { user: { id: string | null } } => ({ user: { id: 'guest-a' } }));
vi.mock('@c1rcle/auth', () => ({ useSessionStore: { getState: () => ({ session: { user } }) } }));
beforeEach(() => {
  user.id = 'guest-a';
  sessionStorage.clear();
  window.history.replaceState(
    {},
    '',
    '/checkout/event?tier=general#accessGrantId=synthetic-private',
  );
});
describe('tab-private return fragment', () => {
  it('restores a private fragment only for the same canonical Guest and path', () => {
    captureGuestReturnFragment('/checkout/event?tier=general');
    user.id = 'guest-b';
    expect(restoreGuestReturnFragment('/checkout/event?tier=general')).toBe(
      '/checkout/event?tier=general',
    );
    user.id = 'guest-a';
    expect(restoreGuestReturnFragment('/checkout/other')).toBe('/checkout/other');
    expect(restoreGuestReturnFragment('/checkout/event?tier=general')).toBe(
      '/checkout/event?tier=general#accessGrantId=synthetic-private',
    );
    expect(restoreGuestReturnFragment('/checkout/event?tier=general')).toBe(
      '/checkout/event?tier=general',
    );
  });
  it('retains an anonymous tab intent until authentication establishes a Guest', () => {
    user.id = null;
    captureGuestReturnFragment('/checkout/event?tier=general');
    expect(restoreGuestReturnFragment('/checkout/event?tier=general')).toBe(
      '/checkout/event?tier=general',
    );
    user.id = 'guest-a';
    expect(restoreGuestReturnFragment('/checkout/event?tier=general')).toBe(
      '/checkout/event?tier=general#accessGrantId=synthetic-private',
    );
  });
});
