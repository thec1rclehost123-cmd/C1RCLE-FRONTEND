import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { POST as rsvp } from './route';

vi.mock('@/lib/bff/auth-proxy', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('@/lib/bff/auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn() };
});

const ORIGIN = 'http://localhost:3000';
const CSRF = 'guest.c1rcle.csrf';
const mockForward = vi.mocked(forwardToGateway);

function req(headers: Record<string, string> = {}, body?: unknown): NextRequest {
  return new NextRequest(`${ORIGIN}/api/rsvp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
    body: JSON.stringify(body ?? { eventId: 'evt_1', tierId: 'tier_1' }),
  });
}

const validHeaders = {
  cookie: `${CSRF}=valid-token; better-auth.session_token=valid-session`,
  'x-csrf-token': 'valid-token',
};

beforeEach(() => {
  mockForward.mockReset();
});

describe('POST /api/rsvp BFF', () => {
  it('rejects cross-origin requests with 403', async () => {
    const request = new NextRequest(`${ORIGIN}/api/rsvp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://malicious.site',
        ...validHeaders,
      },
      body: JSON.stringify({ eventId: 'evt_1', tierId: 'tier_1' }),
    });

    const res = await rsvp(request);
    expect(res.status).toBe(403);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe('forbidden');
  });

  it('rejects unauthenticated requests missing session cookie with 401', async () => {
    const request = req({
      cookie: `${CSRF}=valid-token`,
      'x-csrf-token': 'valid-token',
    });

    const res = await rsvp(request);
    expect(res.status).toBe(401);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe('unauthorized');
  });

  it('rejects requests missing CSRF token with 403', async () => {
    const request = req({
      cookie: `${CSRF}=valid-token; better-auth.session_token=valid-session`,
    });

    const res = await rsvp(request);
    expect(res.status).toBe(403);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe('forbidden');
  });

  it('rejects requests with mismatched CSRF token with 403', async () => {
    const request = req({
      cookie: `${CSRF}=valid-token; better-auth.session_token=valid-session`,
      'x-csrf-token': 'wrong-token',
    });

    const res = await rsvp(request);
    expect(res.status).toBe(403);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe('forbidden');
  });

  it('forwards valid authenticated and CSRF-protected request to gateway and returns 201', async () => {
    mockForward.mockResolvedValue(
      new Response(JSON.stringify({ order: { id: 'ord_123' }, entitlements: [] }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const request = req(validHeaders, { eventId: 'evt_1', tierId: 'tier_1' });
    const res = await rsvp(request);

    expect(res.status).toBe(201);
    const json = (await res.json()) as { order: { id: string } };
    expect(json.order.id).toBe('ord_123');
    expect(mockForward).toHaveBeenCalledWith(
      '/api/v2/rsvp',
      expect.objectContaining({
        method: 'POST',
        body: { eventId: 'evt_1', tierId: 'tier_1' },
      }),
    );
  });
});
