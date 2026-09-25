import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { csrfCookieName, forwardToGateway, putToStorage } from '@/lib/bff/auth-proxy';

import { POST as upload } from './applications/[id]/documents/upload/route';
import { PATCH as autosave } from './applications/[id]/route';
import { POST as submit } from './applications/[id]/submit/route';
import { POST as apply } from './applications/route';
import { GET as me } from './me/route';
import { POST as verifyDocument } from './verify-document/route';

import type { ForwardInit } from '@/lib/bff/auth-proxy';

vi.mock('@/lib/bff/auth-proxy', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest's documented mock-factory pattern
  const actual = await importOriginal<typeof import('@/lib/bff/auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn(), putToStorage: vi.fn() };
});

const APP_ORIGIN = 'http://localhost:3001';
const mockForward = vi.mocked(forwardToGateway);
const mockPut = vi.mocked(putToStorage);

const SESSION_COOKIE =
  'better-auth.session_token=sess_abc; Path=/; HttpOnly; Domain=api.c1rcle.test; Max-Age=604800; SameSite=None; Secure';

function gatewayResponse(
  body: unknown,
  init: { status?: number; setCookie?: string } = {},
): Response {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (init.setCookie !== undefined) {
    headers.append('set-cookie', init.setCookie);
  }
  return new Response(body === null ? null : JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

function jsonRequest(
  path: string,
  headers: Record<string, string>,
  body?: unknown,
): NextRequest {
  return new NextRequest(`${APP_ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function authedHeaders(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    origin: APP_ORIGIN,
    'x-csrf-token': 'tok',
    cookie: `${csrfCookieName()}=tok; better-auth.session_token=sess_abc`,
    ...overrides,
  };
}

const UPLOAD_DTO = {
  uploadUrl: 'https://storage.googleapis.com/thec1rcle-india.firebasestorage.app/obj',
  method: 'PUT',
  headers: { 'content-type': 'image/jpeg' },
  storagePath: 'onboarding/app_1/id_front.jpg',
  expiresAt: 4_102_444_800_000,
};

beforeEach(() => {
  mockForward.mockReset();
  mockPut.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/bff/onboarding/me', () => {
  it('forwards the session cookie and mints a CSRF cookie when absent', async () => {
    mockForward.mockResolvedValue(gatewayResponse({ request: null }));

    const res = await me(
      new NextRequest(`${APP_ORIGIN}/api/bff/onboarding/me`, {
        headers: { origin: APP_ORIGIN, cookie: 'better-auth.session_token=sess_abc' },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockForward).toHaveBeenCalledWith('/api/v2/onboarding/me', {
      method: 'GET',
      cookie: 'better-auth.session_token=sess_abc',
    });
    expect((res.headers.get('set-cookie') ?? '').toLowerCase()).toContain('c1rcle.csrf=');
  });

  it('forwards the in-memory bearer so the gateway can resolve the session', async () => {
    mockForward.mockResolvedValue(gatewayResponse({ request: null }));

    const res = await me(
      new NextRequest(`${APP_ORIGIN}/api/bff/onboarding/me`, {
        headers: {
          origin: APP_ORIGIN,
          cookie: `${csrfCookieName()}=existing`,
          authorization: 'Bearer fe_session_tok_123',
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockForward).toHaveBeenCalledWith('/api/v2/onboarding/me', {
      method: 'GET',
      cookie: `${csrfCookieName()}=existing`,
      headers: { Authorization: 'Bearer fe_session_tok_123' },
    });
  });

  it('does not re-set the CSRF cookie when one is already present', async () => {
    mockForward.mockResolvedValue(gatewayResponse({ request: null }));

    const res = await me(
      new NextRequest(`${APP_ORIGIN}/api/bff/onboarding/me`, {
        headers: {
          origin: APP_ORIGIN,
          cookie: `${csrfCookieName()}=existing; better-auth.session_token=sess_abc`,
        },
      }),
    );

    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('rejects a cross-origin request', async () => {
    const res = await me(
      new NextRequest(`${APP_ORIGIN}/api/bff/onboarding/me`, {
        headers: { origin: 'http://evil.example' },
      }),
    );

    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('passes a gateway error through', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse({ code: 'unauthorized', message: 'No session', status: 401 }, { status: 401 }),
    );

    const res = await me(
      new NextRequest(`${APP_ORIGIN}/api/bff/onboarding/me`, { headers: { origin: APP_ORIGIN } }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: 'unauthorized' });
  });
});

describe('POST /api/bff/onboarding/applications', () => {
  it('forwards the body, CSRF-checked, with the Idempotency-Key and cookie', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse({ request: {} }, { status: 201, setCookie: SESSION_COOKIE }),
    );

    const res = await apply(
      jsonRequest(
        '/api/bff/onboarding/applications',
        authedHeaders({ 'idempotency-key': 'uuid-1' }),
        { requestedType: 'venue', plan: 'standard', profile: { name: 'V' } },
      ),
    );

    expect(res.status).toBe(201);
    const [calledPath, calledInit] = mockForward.mock.calls[0] ?? [];
    expect(calledPath).toBe('/api/v2/onboarding/applications');
    expect(calledInit?.body).toMatchObject({ requestedType: 'venue' });
    expect(calledInit?.headers).toMatchObject({ 'Idempotency-Key': 'uuid-1' });
    expect(calledInit?.cookie ?? '').toContain('better-auth.session_token=sess_abc');
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('better-auth.session_token=sess_abc');
    expect(setCookie.toLowerCase()).not.toContain('domain=');
  });

  it('rejects without a CSRF token', async () => {
    const res = await apply(
      jsonRequest('/api/bff/onboarding/applications', { origin: APP_ORIGIN }, { requestedType: 'venue' }),
    );
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('rejects a cross-origin request', async () => {
    const res = await apply(
      jsonRequest('/api/bff/onboarding/applications', authedHeaders({ origin: 'http://evil.example' })),
    );
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('passes a 409 through so the client can recover an existing draft', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse({ code: 'conflict', message: 'Already started', status: 409 }, { status: 409 }),
    );

    const res = await apply(
      jsonRequest('/api/bff/onboarding/applications', authedHeaders(), { requestedType: 'host' }),
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ code: 'conflict' });
  });
});

describe('PATCH /api/bff/onboarding/applications/[id]', () => {
  it('forwards to the gateway with the intercepted id', async () => {
    mockForward.mockResolvedValue(gatewayResponse({ request: {} }));

    const res = await autosave(
      jsonRequest('/api/bff/onboarding/applications/app_1', authedHeaders(), { capacity: 400 }),
      { params: Promise.resolve({ id: 'app_1' }) },
    );

    expect(res.status).toBe(200);
    const [calledPath, calledInit] = mockForward.mock.calls[0] ?? [];
    expect(calledPath).toBe('/api/v2/onboarding/applications/app_1');
    expect(calledInit?.method).toBe('PATCH');
    expect(calledInit?.body).toEqual({ capacity: 400 });
    expect(calledInit?.cookie ?? '').toContain('better-auth.session_token=sess_abc');
  });

  it('forwards the If-Match version header so the gateway can enforce optimistic locking', async () => {
    mockForward.mockResolvedValue(gatewayResponse({ request: {} }));

    const res = await autosave(
      jsonRequest(
        '/api/bff/onboarding/applications/app_1',
        authedHeaders({ 'if-match': '3' }),
        { capacity: 400 },
      ),
      { params: Promise.resolve({ id: 'app_1' }) },
    );

    expect(res.status).toBe(200);
    expect(mockForward.mock.calls[0]?.[1].headers).toMatchObject({ 'If-Match': '3' });
  });

  it('does not forward a malformed If-Match header', async () => {
    mockForward.mockResolvedValue(gatewayResponse({ request: {} }));

    const res = await autosave(
      jsonRequest(
        '/api/bff/onboarding/applications/app_1',
        authedHeaders({ 'if-match': 'abc' }),
        { capacity: 400 },
      ),
      { params: Promise.resolve({ id: 'app_1' }) },
    );

    expect(res.status).toBe(200);
    expect(mockForward.mock.calls[0]?.[1].headers).not.toHaveProperty('If-Match');
  });

  it('rejects without a CSRF token', async () => {
    const res = await autosave(
      jsonRequest(
        '/api/bff/onboarding/applications/app_1',
        { origin: APP_ORIGIN },
        { capacity: 400 },
      ),
      { params: Promise.resolve({ id: 'app_1' }) },
    );
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });
});

describe('POST /api/bff/onboarding/applications/[id]/submit', () => {
  it('forwards with the Idempotency-Key, cookie, and id', async () => {
    mockForward.mockResolvedValue(gatewayResponse({ request: {} }));

    const res = await submit(
      jsonRequest('/api/bff/onboarding/applications/app_1/submit', authedHeaders({ 'idempotency-key': 'uuid-2' })),
      { params: Promise.resolve({ id: 'app_1' }) },
    );

    expect(res.status).toBe(200);
    const [calledPath, calledInit] = mockForward.mock.calls[0] ?? [];
    expect(calledPath).toBe('/api/v2/onboarding/applications/app_1/submit');
    expect(calledInit?.method).toBe('POST');
    expect(calledInit?.cookie ?? '').toContain('better-auth.session_token=sess_abc');
    expect(calledInit?.headers).toMatchObject({ 'Idempotency-Key': 'uuid-2' });
  });

  it('forwards the If-Match version header along with the Idempotency-Key', async () => {
    mockForward.mockResolvedValue(gatewayResponse({ request: {} }));

    const res = await submit(
      jsonRequest(
        '/api/bff/onboarding/applications/app_1/submit',
        authedHeaders({ 'idempotency-key': 'uuid-2', 'if-match': '5' }),
      ),
      { params: Promise.resolve({ id: 'app_1' }) },
    );

    expect(res.status).toBe(200);
    const [calledPath, calledInit] = mockForward.mock.calls[0] ?? [];
    expect(calledPath).toBe('/api/v2/onboarding/applications/app_1/submit');
    expect(calledInit?.headers).toMatchObject({
      'Idempotency-Key': 'uuid-2',
      'If-Match': '5',
    });
  });

  it('rejects without a CSRF token', async () => {
    const res = await submit(
      jsonRequest('/api/bff/onboarding/applications/app_1/submit', { origin: APP_ORIGIN }),
      { params: Promise.resolve({ id: 'app_1' }) },
    );
    expect(res.status).toBe(403);
  });
});

describe('POST /api/bff/onboarding/verify-document', () => {
  it('forwards and returns the verification result', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse({ passed: false, reason: 'Number format invalid' }),
    );

    const res = await verifyDocument(
      jsonRequest(
        '/api/bff/onboarding/verify-document',
        authedHeaders(),
        { documentType: 'id_front', documentNumber: 'XYZ123' },
      ),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ passed: false, reason: 'Number format invalid' });
    const [calledPath, calledInit] = mockForward.mock.calls[0] ?? [];
    expect(calledPath).toBe('/api/v2/onboarding/verify-document');
    expect(calledInit?.method).toBe('POST');
    expect(calledInit?.body).toEqual({ documentType: 'id_front', documentNumber: 'XYZ123' });
    expect(calledInit?.cookie ?? '').toContain('better-auth.session_token=sess_abc');
  });
});

describe('POST /api/bff/onboarding/applications/[id]/documents/upload', () => {
  const RAW_BODY = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

  function uploadRequest(
    id: string,
    contentType = 'image/jpeg',
    extraHeaders: Record<string, string> = {},
  ): NextRequest {
    return new NextRequest(
      `${APP_ORIGIN}/api/bff/onboarding/applications/${id}/documents/upload?label=id_front`,
      {
        method: 'POST',
        headers: { ...authedHeaders(), 'content-type': contentType, ...extraHeaders },
        body: RAW_BODY,
      },
    );
  }

  /**
   * Gateway stub that mirrors the real gateway: the confirm step
   * (`POST .../documents`) REQUIRES an `Idempotency-Key` header and returns
   * 422 without one — exactly what was 422ing in production.
   */
  function gatewayWithConfirmIdempotency() {
    mockForward.mockImplementation((path: string, init: ForwardInit) => {
      if (path.endsWith('/documents/upload-url')) {
        return Promise.resolve(gatewayResponse(UPLOAD_DTO));
      }
      if (path.endsWith('/documents')) {
        const forwarded = (init.headers ?? {}) as Record<string, string>;
        if (forwarded['Idempotency-Key'] === undefined || forwarded['Idempotency-Key'].length === 0) {
          return Promise.resolve(
            gatewayResponse(
              { code: 'validation', message: 'Idempotency-Key is required', status: 422 },
              { status: 422 },
            ),
          );
        }
        return Promise.resolve(gatewayResponse({ request: { status: 'submitted' } }));
      }
      return Promise.reject(new Error(`unexpected gateway path: ${path}`));
    });
  }

  it('buffers the file, PUTs server-side, and confirms with an Idempotency-Key', async () => {
    gatewayWithConfirmIdempotency();
    mockPut.mockResolvedValueOnce(true);

    const res = await upload(uploadRequest('app_1'), { params: Promise.resolve({ id: 'app_1' }) });

    expect(res.status).toBe(200);
    expect(mockForward.mock.calls[0]?.[0]).toBe('/api/v2/onboarding/applications/app_1/documents/upload-url');
    expect(mockForward.mock.calls[0]?.[1].body).toEqual({ label: 'id_front', contentType: 'image/jpeg' });
    expect(mockPut).toHaveBeenCalledWith(UPLOAD_DTO.uploadUrl, UPLOAD_DTO.headers, expect.any(ArrayBuffer));
    expect(mockForward.mock.calls[1]?.[0]).toBe('/api/v2/onboarding/applications/app_1/documents');
    expect(mockForward.mock.calls[1]?.[1].body).toEqual({
      label: 'id_front',
      storagePath: UPLOAD_DTO.storagePath,
    });
    const confirmHeaders = mockForward.mock.calls[1]?.[1].headers ?? {};
    expect(Object.keys(confirmHeaders)).toContain('Idempotency-Key');
  });

  it('generates its own Idempotency-Key for the confirmation when the caller sends none', async () => {
    gatewayWithConfirmIdempotency();
    mockPut.mockResolvedValueOnce(true);

    const res = await upload(uploadRequest('app_1'), { params: Promise.resolve({ id: 'app_1' }) });

    expect(res.status).toBe(200);
    const confirmKey = (mockForward.mock.calls[1]?.[1].headers as Record<string, string> | undefined)?.[
      'Idempotency-Key'
    ];
    expect(confirmKey).toMatch(/^[A-Za-z0-9_-]{1,128}$/);
    const urlKey = (mockForward.mock.calls[0]?.[1].headers as Record<string, string> | undefined)?.[
      'Idempotency-Key'
    ];
    expect(urlKey).toBe(confirmKey);
  });

  it('forwards the caller-supplied Idempotency-Key verbatim to both gateway calls', async () => {
    gatewayWithConfirmIdempotency();
    mockPut.mockResolvedValueOnce(true);

    const res = await upload(uploadRequest('app_1', 'image/jpeg', { 'idempotency-key': 'client-key-1' }), {
      params: Promise.resolve({ id: 'app_1' }),
    });

    expect(res.status).toBe(200);
    expect(mockForward.mock.calls[0]?.[1].headers).toMatchObject({ 'Idempotency-Key': 'client-key-1' });
    expect(mockForward.mock.calls[1]?.[1].headers).toMatchObject({ 'Idempotency-Key': 'client-key-1' });
  });

  it('forwards the If-Match version header to both the upload-url and confirm steps', async () => {
    gatewayWithConfirmIdempotency();
    mockPut.mockResolvedValueOnce(true);

    const res = await upload(uploadRequest('app_1', 'image/jpeg', { 'if-match': '2' }), {
      params: Promise.resolve({ id: 'app_1' }),
    });

    expect(res.status).toBe(200);
    expect(mockForward.mock.calls[0]?.[1].headers).toMatchObject({ 'If-Match': '2' });
    expect(mockForward.mock.calls[1]?.[1].headers).toMatchObject({ 'If-Match': '2' });
  });

  it('drops a malformed If-Match instead of forwarding it to the gateway', async () => {
    gatewayWithConfirmIdempotency();
    mockPut.mockResolvedValueOnce(true);

    const res = await upload(uploadRequest('app_1', 'image/jpeg', { 'if-match': 'v2' }), {
      params: Promise.resolve({ id: 'app_1' }),
    });

    expect(res.status).toBe(200);
    expect(mockForward.mock.calls[0]?.[1].headers).not.toHaveProperty('If-Match');
    expect(mockForward.mock.calls[1]?.[1].headers).not.toHaveProperty('If-Match');
  });

  it('rejects an unknown label', async () => {
    const req = new NextRequest(
      `${APP_ORIGIN}/api/bff/onboarding/applications/app_1/documents/upload?label=nope`,
      { method: 'POST', headers: { ...authedHeaders(), 'content-type': 'image/jpeg' }, body: RAW_BODY },
    );
    const res = await upload(req, { params: Promise.resolve({ id: 'app_1' }) });

    expect(res.status).toBe(400);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('rejects a disallowed content type', async () => {
    const res = await upload(uploadRequest('app_1', 'application/pdf'), {
      params: Promise.resolve({ id: 'app_1' }),
    });

    expect(res.status).toBe(415);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('rejects an oversized file without touching the gateway', async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const res = await upload(
      new NextRequest(
        `${APP_ORIGIN}/api/bff/onboarding/applications/app_1/documents/upload?label=id_front`,
        { method: 'POST', headers: { ...authedHeaders(), 'content-type': 'image/jpeg' }, body: big },
      ),
      { params: Promise.resolve({ id: 'app_1' }) },
    );

    expect(res.status).toBe(413);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('returns 502 when the server-side storage PUT fails', async () => {
    mockForward.mockResolvedValueOnce(gatewayResponse(UPLOAD_DTO));
    mockPut.mockResolvedValueOnce(false);

    const res = await upload(uploadRequest('app_1'), { params: Promise.resolve({ id: 'app_1' }) });

    expect(res.status).toBe(502);
    expect(mockForward).toHaveBeenCalledTimes(1);
  });

  it('passes a gateway error on upload-url through', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse({ code: 'validation', message: 'Plan limitation', status: 422 }, { status: 422 }),
    );

    const res = await upload(uploadRequest('app_1'), { params: Promise.resolve({ id: 'app_1' }) });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ code: 'validation' });
    expect(mockPut).not.toHaveBeenCalled();
  });
});