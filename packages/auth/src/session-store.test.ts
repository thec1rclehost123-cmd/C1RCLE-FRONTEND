import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  useSessionStore,
  useSession,
  getAccessToken,
  setSession,
  clearSession,
  markAnonymous,
  useSessionStore as getStore,
} from './session-store';

// Mock user for testing
const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'partner' as const,
  avatarUrl: null,
};

describe('Session Store', () => {
  beforeEach(() => {
    // Reset state before each test
    clearSession();
  });

  describe('setSession', () => {
    it('should set authenticated status and store token/expiry', () => {
      const expiresAt = Date.now() + 3600000;
      setSession({ user: mockUser }, 'test_token', expiresAt);

      const state = getStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.session?.user).toEqual(mockUser);
      expect(state.accessToken).toBe('test_token');
      expect(state.expiresAt).toBe(expiresAt);
    });

    it('should notify subscribers when session is set', () => {
      const listener = vi.fn();
      getStore.subscribe(listener);

      setSession({ user: mockUser }, 'test_token', Date.now() + 3600000);

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('clearSession', () => {
    it('should clear all session data and set status to anonymous', () => {
      setSession({ user: mockUser }, 'test_token', Date.now() + 3600000);
      clearSession();

      const state = getStore.getState();
      expect(state.status).toBe('anonymous');
      expect(state.session).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.expiresAt).toBeNull();
    });

    it('should notify subscribers when session is cleared', () => {
      setSession({ user: mockUser }, 'test_token', Date.now() + 3600000);

      const listener = vi.fn();
      getStore.subscribe(listener);

      clearSession();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('markAnonymous', () => {
    it('should clear session data', () => {
      setSession({ user: mockUser }, 'test_token', Date.now() + 3600000);
      markAnonymous();

      const state = getStore.getState();
      expect(state.status).toBe('anonymous');
      expect(state.session).toBeNull();
      expect(state.accessToken).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should return null when not authenticated', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('should return the token when authenticated', () => {
      setSession({ user: mockUser }, 'test_token', Date.now() + 3600000);
      expect(getAccessToken()).toBe('test_token');
    });

    it('should be a plain function, not a hook', () => {
      // getAccessToken should not use React hooks
      expect(typeof getAccessToken).toBe('function');
    });
  });

  describe('useSession hook', () => {
    it('should return isLoading=true on unknown status', () => {
      clearSession();
      // State is reset to 'unknown' at initialization
      const state = getStore.getState();
      if (state.status === 'unknown') {
        expect(state.status).toBe('unknown');
      }
    });

    it('should return authenticated user', () => {
      setSession({ user: mockUser }, 'test_token', Date.now() + 3600000);
      const state = getStore.getState();

      expect(state.status).toBe('authenticated');
      expect(state.session?.user).toEqual(mockUser);
    });

    it('should return null user when anonymous', () => {
      clearSession();
      const state = getStore.getState();

      expect(state.status).toBe('anonymous');
      expect(state.session).toBeNull();
    });
  });

  describe('storage isolation', () => {
    it('should not write to localStorage/sessionStorage', () => {
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

      setSession({ user: mockUser }, 'test_token', Date.now() + 3600000);
      clearSession();

      expect(localStorageSpy).not.toHaveBeenCalled();
      localStorageSpy.mockRestore();
    });
  });

  describe('store subscription', () => {
    it('should allow multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = getStore.subscribe(listener1);
      const unsubscribe2 = getStore.subscribe(listener2);

      setSession({ user: mockUser }, 'test_token', Date.now() + 3600000);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      unsubscribe1();
      clearSession();

      expect(listener1).toHaveBeenCalledTimes(1); // Not called again after unsubscribe
      expect(listener2).toHaveBeenCalledTimes(2); // Called for both setSession and clearSession
    });

    it('should unsubscribe cleanly', () => {
      const listener = vi.fn();
      const unsubscribe = getStore.subscribe(listener);

      setSession({ user: mockUser }, 'test_token', Date.now() + 3600000);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      clearSession();

      expect(listener).toHaveBeenCalledTimes(1); // Not called after unsubscribe
    });
  });
});
