import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearSession,
  getAccessToken,
  markAnonymous,
  setSession,
  useSession,
  useSessionStore,
} from './session-store.js';

const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'partner' as const,
  avatarUrl: null,
};

describe('session-store', () => {
  beforeEach(() => {
    useSessionStore.setState({
      session: null,
      accessToken: null,
      expiresAt: null,
      status: 'unknown',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setSession', () => {
    it('marks the store authenticated and stores token + expiry', () => {
      const expiresAt = Date.now() + 3_600_000;
      setSession({ user: mockUser }, 'test_token', expiresAt);

      const state = useSessionStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.session?.user).toEqual(mockUser);
      expect(state.accessToken).toBe('test_token');
      expect(state.expiresAt).toBe(expiresAt);
    });

    it('accepts a null access token (server bootstrap has no in-memory token yet)', () => {
      setSession({ user: mockUser }, null, Date.now() + 3_600_000);

      const state = useSessionStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.accessToken).toBeNull();
    });

    it('notifies subscribers', () => {
      const listener = vi.fn();
      useSessionStore.subscribe(listener);

      setSession({ user: mockUser }, 'test_token', Date.now() + 3_600_000);

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('clearSession / markAnonymous', () => {
    it('clearSession wipes state and sets status anonymous', () => {
      setSession({ user: mockUser }, 'test_token', Date.now() + 3_600_000);
      clearSession();

      const state = useSessionStore.getState();
      expect(state.status).toBe('anonymous');
      expect(state.session).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.expiresAt).toBeNull();
    });

    it('markAnonymous reaches the same terminal state', () => {
      setSession({ user: mockUser }, 'test_token', Date.now() + 3_600_000);
      markAnonymous();

      expect(useSessionStore.getState().status).toBe('anonymous');
      expect(useSessionStore.getState().session).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('is a plain function that returns the raw token, not a hook', () => {
      expect(getAccessToken()).toBeNull();

      setSession({ user: mockUser }, 'test_token', Date.now() + 3_600_000);
      expect(getAccessToken()).toBe('test_token');
    });
  });

  describe('useSession', () => {
    it('reflects the store: loading -> authenticated -> anonymous', () => {
      const { result, rerender } = renderHook(() => useSession());
      expect(result.current).toEqual({ isAuthenticated: false, isLoading: true, user: null });

      setSession({ user: mockUser }, 'test_token', Date.now() + 3_600_000);
      rerender();
      expect(result.current).toEqual({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
      });

      clearSession();
      rerender();
      expect(result.current).toEqual({ isAuthenticated: false, isLoading: false, user: null });
    });
  });

  describe('storage isolation', () => {
    it('never writes to localStorage or sessionStorage', () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem');

      setSession({ user: mockUser }, 'test_token', Date.now() + 3_600_000);
      markAnonymous();
      clearSession();

      expect(setItem).not.toHaveBeenCalled();
    });
  });

  describe('subscriptions', () => {
    it('stops notifying after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = useSessionStore.subscribe(listener);

      setSession({ user: mockUser }, 'test_token', Date.now() + 3_600_000);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      clearSession();
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
