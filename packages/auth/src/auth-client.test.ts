import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchSession, login, logout, refresh, signup } from './auth-client.js';
import { useSessionStore } from './session-store.js';

const user = {
  id: 'usr_1',
  email: 'a@b.com',
  displayName: 'A',
  role: 'partner' as const,
  avatarUrl: null,
};

const authBody = (over: Record<string, unknown> = {}) => ({
  user,
  accessToken: 'tok_abc',
  expiresAt: 1_900_000_000_000,
  ...over,
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function stubFetch(): ReturnType<typeof vi.fn<typeof fetch>> {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', mock);
  return mock;
}

beforeEach(() => {
  useSessionStore.setState({
    session: null,
    accessToken: null,
    expiresAt: null,
    status: 'unknown',
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('auth-client', () => {
  describe('signup', () => {
    it('validates the body, omits role, and populates the session', async () => {
      const fetchMock = stubFetch();
      fetchMock.mockResolvedValue(jsonResponse(authBody()));

      await signup({ email: 'a@b.com', password: 'password123', displayName: 'A' });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/signup'),
        expect.anything(),
      );
      const rawBody = fetchMock.mock.calls[0]?.[1]?.body;
      const sentBody = JSON.parse(typeof rawBody === 'string' ? rawBody : '{}') as Record<
        string,
        unknown
      >;
      expect(sentBody).not.toHaveProperty('role');
      expect(sentBody).toMatchObject({ email: 'a@b.com', displayName: 'A' });

      const state = useSessionStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.accessToken).toBe('tok_abc');
    });

    it('rejects an invalid body before any network call', async () => {
      const fetchMock = stubFetch();

      await expect(
        signup({ email: 'not-an-email', password: 'x', displayName: '' }),
      ).rejects.toBeInstanceOf(Error);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('throws a fixed generic message on 401 regardless of the backend body', async () => {
      stubFetch().mockResolvedValue(
        jsonResponse(
          { code: 'unauthorized', message: 'No account exists for that email address' },
          401,
        ),
      );

      await expect(login({ email: 'a@b.com', password: 'password123' })).rejects.toThrow(
        'Authentication failed',
      );
    });

    it('populates the session on success', async () => {
      stubFetch().mockResolvedValue(jsonResponse(authBody()));

      await login({ email: 'a@b.com', password: 'password123' });

      expect(useSessionStore.getState().status).toBe('authenticated');
    });
  });

  describe('refresh stampede guard', () => {
    it('consolidates concurrent calls into one network request', async () => {
      const fetchMock = stubFetch();
      fetchMock.mockResolvedValue(jsonResponse(authBody()));

      const results = await Promise.all([refresh(), refresh(), refresh(), refresh(), refresh()]);

      expect(results).toEqual([true, true, true, true, true]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('clears the in-flight promise so a later call refreshes again', async () => {
      const fetchMock = stubFetch();
      fetchMock.mockResolvedValue(jsonResponse(authBody()));

      await refresh();
      await refresh();

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('clears the session and resolves false on failure', async () => {
      stubFetch().mockResolvedValue(jsonResponse({ code: 'unauthorized', message: 'x' }, 401));
      useSessionStore.setState({
        session: { user },
        accessToken: 'old',
        expiresAt: 1,
        status: 'authenticated',
      });

      await expect(refresh()).resolves.toBe(false);
      expect(useSessionStore.getState().status).toBe('anonymous');
    });
  });

  describe('logout', () => {
    it('clears the session even when the network call fails', async () => {
      stubFetch().mockRejectedValue(new TypeError('Failed to fetch'));
      useSessionStore.setState({
        session: { user },
        accessToken: 'tok',
        expiresAt: 1,
        status: 'authenticated',
      });

      await expect(logout()).resolves.toBeUndefined();
      expect(useSessionStore.getState().status).toBe('anonymous');
    });
  });

  describe('fetchSession', () => {
    it('marks the store anonymous on 401', async () => {
      stubFetch().mockResolvedValue(jsonResponse({ code: 'unauthorized', message: 'x' }, 401));

      await fetchSession();

      expect(useSessionStore.getState().status).toBe('anonymous');
    });
  });

  describe('storage isolation', () => {
    it('keeps everything in memory across a login / logout cycle', async () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      const fetchMock = stubFetch();

      fetchMock.mockResolvedValueOnce(jsonResponse(authBody()));
      await login({ email: 'a@b.com', password: 'password123' });

      fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
      await logout();

      expect(setItem).not.toHaveBeenCalled();
    });
  });
});
