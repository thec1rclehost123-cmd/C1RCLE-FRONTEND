import { beforeEach, describe, expect, it } from 'vitest';

import { clearSession, getAccessToken, useSessionStore } from './session-store.js';

import type { Session, UserId } from '@c1rcle/types';

const session: Session = {
  user: {
    id: 'u_1' as UserId,
    email: 'partner@c1rcle.test',
    displayName: 'Partner',
    role: 'partner',
    avatarUrl: null,
  },
  expiresAt: Date.now() + 60_000,
};

describe('session store', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null, accessToken: null, status: 'unknown' });
  });

  it('starts in an unknown state so guards do not redirect prematurely', () => {
    expect(useSessionStore.getState().status).toBe('unknown');
  });

  it('exposes the token to the api client without a React subscription', () => {
    useSessionStore.getState().setSession(session, 'tok_abc');
    expect(getAccessToken()).toBe('tok_abc');
  });

  it('drops the token on sign out', () => {
    useSessionStore.getState().setSession(session, 'tok_abc');
    clearSession();

    expect(getAccessToken()).toBeNull();
    expect(useSessionStore.getState().status).toBe('anonymous');
  });
});
