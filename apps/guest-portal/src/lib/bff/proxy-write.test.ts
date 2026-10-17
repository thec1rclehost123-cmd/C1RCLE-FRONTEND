import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { idempotencyKeyFor, proxyGatewayWrite } from './proxy-write';

vi.mock('@/lib/bff/auth-proxy', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('@/lib/bff/auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn() };
});

const ORIGIN = 'http://localhost:3000';
const CSRF = 'guest.c1rcle.csrf';
const mockForward = vi.mocked(forwardToGateway);

const signedIn = {
  cookie: `${CSRF}=tok; better-auth.session_token=sess`,
  'x-csrf-token': 'tok',
};

function req(headers: Record<string, string> = {}, body: unknown = { holdId: 'hold_1' }) {
  return new NextRequest(`${ORIGIN}/api/x`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const options = {
  gatewayPath: '/api/v2/payments/attempts',
  successStatus: 201,
  unauthenticatedMessage: 'Sign in.',
  idempotent: true,
};

beforeEach(() => {
  mockForward.mockReset();
});

describe('proxyGatewayWrite', () => {
  it('refuses a cross-origin request and never calls the gateway', async () => {
    const res = await proxyGatewayWrite(req({ ...signedIn, origin: 'http://evil.site' }), options);

    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('refuses a request with no session cookie', async () => {
    const res = await proxyGatewayWrite(
      req({ cookie: `${CSRF}=tok`, 'x-csrf-token': 'tok' }),
      options,
    );

    expect(res.status).toBe(401);
    expect(((await res.json()) as { message: string }).message).toBe('Sign in.');
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('refuses a request without a matching CSRF token', async () => {
    const res = await proxyGatewayWrite(req({ cookie: signedIn.cookie }), options);

    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('refuses a body that is not JSON', async () => {
    const res = await proxyGatewayWrite(req(signedIn, '{not json'), options);

    expect(res.status).toBe(400);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('forwards the body and the browser cookie, and returns the success status', async () => {
    mockForward.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 201 }));

    const res = await proxyGatewayWrite(req(signedIn), options);

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    const [path, init] = mockForward.mock.calls[0] ?? [];
    expect(path).toBe('/api/v2/payments/attempts');
    expect(init?.body).toEqual({ holdId: 'hold_1' });
    expect(init?.cookie).toContain('better-auth.session_token=sess');
  });

  it('strips prototype-polluting keys from the body before forwarding', async () => {
    mockForward.mockResolvedValue(new Response('{}', { status: 201 }));

    await proxyGatewayWrite(req(signedIn, '{"holdId":"h","__proto__":{"admin":true}}'), options);

    const body = mockForward.mock.calls[0]?.[1].body as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(['holdId']);
    expect((body as { admin?: boolean }).admin).toBeUndefined();
  });

  it('passes a gateway error through instead of reporting success', async () => {
    mockForward.mockResolvedValue(
      new Response(JSON.stringify({ status: 409, code: 'conflict', message: 'Sold out.' }), {
        status: 409,
      }),
    );

    const res = await proxyGatewayWrite(req(signedIn), options);

    expect(res.status).toBe(409);
  });

  it('sends no Idempotency-Key for a non-idempotent route', async () => {
    mockForward.mockResolvedValue(new Response('{}', { status: 200 }));

    await proxyGatewayWrite(req(signedIn), { ...options, idempotent: false });

    expect(mockForward.mock.calls[0]?.[1].headers).toBeUndefined();
  });
});

describe('idempotencyKeyFor', () => {
  it('uses a well-formed key from the browser so a retry replays', () => {
    expect(idempotencyKeyFor(req({ 'idempotency-key': 'attempt-abc_123-hold' }))).toBe(
      'attempt-abc_123-hold',
    );
  });

  it('ignores a malformed or too-short key and mints a fresh one', () => {
    for (const bad of ['short', 'has spaces in it', 'x'.repeat(200), 'semi;colon-key']) {
      const key = idempotencyKeyFor(req({ 'idempotency-key': bad }));
      expect(key).not.toBe(bad);
      expect(key).toMatch(/^[0-9a-f-]{36}$/);
    }
  });

  it('mints a distinct key per request when none is supplied', () => {
    expect(idempotencyKeyFor(req())).not.toBe(idempotencyKeyFor(req()));
  });
});
