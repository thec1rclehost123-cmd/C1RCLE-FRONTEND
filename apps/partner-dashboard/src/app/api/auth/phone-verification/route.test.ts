import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { POST as phoneVerification } from './route';

/**
 * ─── Phone verification BFF route ───────────────────────────────────────────
 * Session-scoped (unlike OTP send/verify) — requires same-origin AND CSRF,
 * same as `refresh`/`logout`.
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

beforeEach(() => {
  mockForward.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const CSRF_HEADERS = {
  origin: APP_ORIGIN,
  'x-csrf-token': 'tok',
  cookie: 'c1rcle.csrf=tok; better-auth.session_token=sess_abc',
};

describe('POST /api/auth/phone-verification', () => {
  it('rejects a missing CSRF token', async () => {
    const res = await phoneVerification(
      post(
        '/api/auth/phone-verification',
        { origin: APP_ORIGIN },
        { phoneNumber: '+919876543210', idToken: 'firebase-id-token' },
      ),
    );
    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('rejects a malformed body', async () => {
    const res = await phoneVerification(
      post('/api/auth/phone-verification', CSRF_HEADERS, { phoneNumber: '+919876543210' }),
    );
    expect(res.status).toBe(400);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('forwards documentType/documentNumber/proofToken to verify-document, with the session cookie', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse({
        passed: true,
        provider: 'firebase-phone',
        reason: null,
        referenceId: 'uid_1',
      }),
    );

    const res = await phoneVerification(
      post('/api/auth/phone-verification', CSRF_HEADERS, {
        phoneNumber: '+919876543210',
        idToken: 'firebase-id-token',
      }),
    );

    expect(res.status).toBe(200);
    const [calledPath, calledInit] = mockForward.mock.calls[0] as [
      string,
      { body?: unknown; cookie?: string | null },
    ];
    expect(calledPath).toBe('/api/v2/onboarding/verify-document');
    expect(calledInit.body).toEqual({
      documentType: 'phone',
      documentNumber: '+919876543210',
      proofToken: 'firebase-id-token',
    });
    expect(calledInit.cookie).toContain('better-auth.session_token=sess_abc');
  });

  it('passes a phone-mismatch failure straight through', async () => {
    mockForward.mockResolvedValue(
      gatewayResponse({
        passed: false,
        provider: 'firebase-phone',
        reason: 'phone_mismatch',
        referenceId: null,
      }),
    );
    const res = await phoneVerification(
      post('/api/auth/phone-verification', CSRF_HEADERS, {
        phoneNumber: '+911111111111',
        idToken: 'firebase-id-token',
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { passed: boolean };
    expect(body.passed).toBe(false);
  });
});
