import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Module-level state (token, user, listeners) means each test needs a fresh
// module instance — we reset modules and dynamically import in every test.
let auth: typeof import('./index');

interface AuthBridgeResponseLike {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: 'guest' | 'partner' | 'admin';
    avatarUrl: string | null;
  };
  accessToken: string;
  expiresAt: number;
}

type FetchMock = ReturnType<typeof vi.fn>;

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

const bridgePayload = (overrides: Partial<AuthBridgeResponseLike> = {}): AuthBridgeResponseLike => ({
  user: {
    id: 'user-1',
    email: 'partner@example.com',
    displayName: 'Partner One',
    role: 'partner',
    avatarUrl: null,
  },
  accessToken: 'access-token-1',
  expiresAt: Date.now() + 900_000,
  ...overrides,
});

beforeEach(async () => {
  vi.resetModules();
  auth = await import('./index');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('signIn', () => {
  it('posts credentials to /api/v2/auth/login and stores the session', async () => {
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(okResponse(bridgePayload()));
    vi.stubGlobal('fetch', fetchMock);

    const user = await auth.getAuthClient().signIn('partner@example.com', 'secret');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v2/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      email: 'partner@example.com',
      password: 'secret',
    });

    expect(user.id).toBe('user-1');
    expect(user.uid).toBe('user-1');
    expect(user.email).toBe('partner@example.com');
    expect(user.role).toBe('partner');
    expect(auth.getAccessToken()).toBe('access-token-1');
    await expect(user.getIdToken()).resolves.toBe('access-token-1');
  });

  it('sends a unique x-request-id header per the V2 contract', async () => {
    const fetchMock: FetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(okResponse(bridgePayload())));
    vi.stubGlobal('fetch', fetchMock);

    await auth.getAuthClient().signIn('a@example.com', 'pw');
    await auth.getAuthClient().signIn('b@example.com', 'pw');

    const headers1 = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    const headers2 = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(headers1['x-request-id']).toBeTruthy();
    expect(headers2['x-request-id']).toBeTruthy();
    expect(headers1['x-request-id']).not.toBe(headers2['x-request-id']);
  });

  it('throws an AuthError with backend code/message on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        errorResponse(401, {
          status: 401,
          code: 'invalid_credentials',
          message: 'Email or password is incorrect',
        }),
      ),
    );

    await expect(auth.getAuthClient().signIn('partner@example.com', 'wrong')).rejects.toMatchObject({
      name: 'AuthError',
      code: 'invalid_credentials',
      status: 401,
      message: 'Email or password is incorrect',
    });
    expect(auth.getAccessToken()).toBeNull();
  });
});

describe('signUp', () => {
  it('posts the profile to /api/v2/auth/signup and stores the session', async () => {
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(okResponse(bridgePayload()));
    vi.stubGlobal('fetch', fetchMock);

    const user = await auth.getAuthClient().signUp('new@example.com', 'secret', 'New Partner');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v2/auth/signup');
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({
      email: 'new@example.com',
      password: 'secret',
      displayName: 'New Partner',
    });
    expect(user.displayName).toBe('Partner One');
    expect(auth.getAccessToken()).toBe('access-token-1');
  });
});

describe('signOut', () => {
  it('calls logout and clears local state', async () => {
    const fetchMock: FetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse(bridgePayload()))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const client = auth.getAuthClient();
    await client.signIn('partner@example.com', 'secret');
    expect(auth.getAccessToken()).not.toBeNull();

    await client.signOut();

    expect(fetchMock.mock.calls[1][0]).toBe('/api/v2/auth/logout');
    expect(auth.getAccessToken()).toBeNull();
  });

  it('clears state even when the logout endpoint fails', async () => {
    const fetchMock: FetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse(bridgePayload()))
      .mockResolvedValue(errorResponse(500, { status: 500, code: 'internal', message: 'boom' }));
    vi.stubGlobal('fetch', fetchMock);

    const client = auth.getAuthClient();
    await client.signIn('partner@example.com', 'secret');
    await client.signOut();

    expect(auth.getAccessToken()).toBeNull();
  });
});

describe('refreshSession', () => {
  it('returns and stores the refreshed user on success', async () => {
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(okResponse(bridgePayload()));
    vi.stubGlobal('fetch', fetchMock);

    const user = await auth.getAuthClient().refreshSession();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v2/auth/refresh');
    expect(user?.id).toBe('user-1');
    expect(auth.getAccessToken()).toBe('access-token-1');
  });

  it('returns null and clears state when there is no session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(401, { status: 401, code: 'no_session', message: 'No session' })),
    );

    const user = await auth.getAuthClient().refreshSession();

    expect(user).toBeNull();
    expect(auth.getAccessToken()).toBeNull();
  });
});

describe('onAuthStateChanged / hydrate', () => {
  it('restores the session from the httpOnly cookie on first subscription', async () => {
    vi.stubGlobal('window', {});
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(okResponse(bridgePayload()));
    vi.stubGlobal('fetch', fetchMock);

    const seen: Array<unknown> = [];
    const unsubscribe = auth.getAuthClient().onAuthStateChanged((u) => seen.push(u));
    // Initial synchronous callback fires via queueMicrotask; hydrate runs after.
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));

    expect(seen[0]).toBeNull();
    expect(seen.at(-1)).toMatchObject({ id: 'user-1' });
    expect(auth.getAccessToken()).toBe('access-token-1');
    unsubscribe();
  });

  it('notifies null when cookie restore fails', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(401, { status: 401, code: 'no_session', message: 'No session' })),
    );

    const seen: Array<unknown> = [];
    const unsubscribe = auth.getAuthClient().onAuthStateChanged((u) => seen.push(u));
    await new Promise((r) => setTimeout(r, 0));

    expect(seen.every((u) => u === null)).toBe(true);
    expect(auth.getAccessToken()).toBeNull();
    unsubscribe();
  });
});

describe('signInWithGoogle', () => {
  it('is explicitly not implemented yet', async () => {
    await expect(auth.getAuthClient().signInWithGoogle()).rejects.toMatchObject({
      code: 'not_implemented',
      status: 501,
    });
  });
});
