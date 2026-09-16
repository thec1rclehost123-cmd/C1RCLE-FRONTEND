import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { POST as otpSend } from './send/route';
import { POST as otpVerify } from './verify/route';

/**
 * ─── Email OTP BFF routes ────────────────────────────────────────────────────
 * Session-scoped, same test shape as `phone-verification/route.test.ts`
 * and `../routes.test.ts`: mock `forwardToGateway`, assert the proxy forwards
 * to the right gateway path with the session cookie and passes the response
 * through unchanged.
 */
vi.mock('@/lib/bff/auth-proxy', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest's documented mock-factory pattern
  const actual = await importOriginal<typeof import('@/lib/bff/auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn() };
});

const APP_ORIGIN = 'http://localhost:3001';
const mockForward = vi.mocked(forwardToGateway);

function gatewayResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

function post(path: string, headers: Record<string, string>, body?: unknown): NextRequest {
  return new NextRequest(`${APP_ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const CSRF_HEADERS = {
  origin: APP_ORIGIN,
  'x-csrf-token': 'tok',
  cookie: 'c1rcle.csrf=tok; better-auth.session_token=sess_abc',
};

beforeEach(() => {
  mockForward.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/auth/otp/send', () => {
  it('rejects a missing CSRF token', async () => {
    const res = await otpSend(
      post('/api/auth/otp/send', { origin: APP_ORIGIN }, { email: 'a@b.com' }),
    );
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('forwards to /api/v2/auth/otp/send, carrying the session cookie, and passes the ack through', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse({ message: 'If valid, a code has been sent.' }),
    );

    const res = await otpSend(post('/api/auth/otp/send', CSRF_HEADERS, { email: 'a@b.com' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: 'If valid, a code has been sent.' });
    const [calledPath, calledInit] = mockForward.mock.calls[0] as [
      string,
      { body?: unknown; cookie?: string | null },
    ];
    expect(calledPath).toBe('/api/v2/auth/otp/send');
    expect(calledInit.body).toEqual({ email: 'a@b.com' });
    expect(calledInit.cookie).toContain('better-auth.session_token=sess_abc');
  });

  it('rejects a cross-origin request', async () => {
    const res = await otpSend(
      post('/api/auth/otp/send', { origin: 'https://evil.example' }, { email: 'a@b.com' }),
    );
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('passes a gateway error straight through', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse(
        { code: 'rate_limited', message: 'Too many requests', status: 429 },
        { status: 429 },
      ),
    );
    const res = await otpSend(post('/api/auth/otp/send', CSRF_HEADERS, { email: 'a@b.com' }));
    expect(res.status).toBe(429);
  });
});

describe('POST /api/auth/otp/verify', () => {
  it('rejects a missing CSRF token', async () => {
    const res = await otpVerify(
      post(
        '/api/auth/otp/verify',
        { origin: APP_ORIGIN },
        { email: 'a@b.com', code: '123456' },
      ),
    );
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('forwards to /api/v2/auth/otp/verify with the body unchanged, carrying the session cookie', async () => {
    mockForward.mockResolvedValue(gatewayResponse({ message: 'Verified.' }));

    const res = await otpVerify(
      post(
        '/api/auth/otp/verify',
        CSRF_HEADERS,
        { email: 'a@b.com', code: '123456' },
      ),
    );

    expect(res.status).toBe(200);
    const [calledPath, calledInit] = mockForward.mock.calls[0] as [
      string,
      { body?: unknown; cookie?: string | null },
    ];
    expect(calledPath).toBe('/api/v2/auth/otp/verify');
    expect(calledInit.body).toEqual({ email: 'a@b.com', code: '123456' });
    expect(calledInit.cookie).toContain('better-auth.session_token=sess_abc');
  });

  it('passes a wrong-code 400 straight through', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse(
        { code: 'validation', message: 'Invalid or expired code.', status: 400 },
        { status: 400 },
      ),
    );
    const res = await otpVerify(
      post(
        '/api/auth/otp/verify',
        CSRF_HEADERS,
        { email: 'a@b.com', code: '000000' },
      ),
    );
    expect(res.status).toBe(400);
  });
});
