import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { PUT } from './route';

vi.mock('@/lib/bff/auth-proxy', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('@/lib/bff/auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn() };
});

const ORIGIN = 'http://localhost:3000';
const CSRF = 'guest.c1rcle.csrf';
const PROFILE = {
  displayName: 'Test Guest',
  dateOfBirth: '1990-01-01',
  city: 'Pune',
  tastes: ['Music', 'Art', 'Food'],
  intents: ['Discover'],
};
const mockForward = vi.mocked(forwardToGateway);

function request(headers: Record<string, string> = {}, body: unknown = PROFILE): NextRequest {
  return new NextRequest(`${ORIGIN}/api/profile/me`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      origin: ORIGIN,
      cookie: `${CSRF}=valid-token; better-auth.session_token=valid-session`,
      'x-csrf-token': 'valid-token',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockForward.mockReset();
});

describe('PUT /api/profile/me BFF', () => {
  it('rejects cross-origin requests', async () => {
    const response = await PUT(request({ origin: 'https://outside.example' }));
    expect(response.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('requires an authenticated session and a matching CSRF token', async () => {
    const unauthenticated = await PUT(
      request({ cookie: `${CSRF}=valid-token`, 'x-csrf-token': 'valid-token' }),
    );
    expect(unauthenticated.status).toBe(401);

    const csrfRejected = await PUT(request({ 'x-csrf-token': 'wrong-token' }));
    expect(csrfRejected.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('rejects invalid or mass-assigned profile fields before forwarding', async () => {
    const response = await PUT(request({}, { ...PROFILE, role: 'admin' }));
    expect(response.status).toBe(422);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('forwards only the validated full-replace profile and returns the saved profile', async () => {
    mockForward.mockResolvedValue(
      new Response(JSON.stringify({ userId: 'guest_1', ...PROFILE }), { status: 200 }),
    );

    const response = await PUT(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ userId: 'guest_1', city: 'Pune' });
    expect(mockForward).toHaveBeenCalledWith(
      '/api/v2/profile/me',
      expect.objectContaining({ method: 'PUT', body: PROFILE }),
    );
  });
});
