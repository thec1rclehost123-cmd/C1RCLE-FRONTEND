import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from './auth-proxy';
import { proxyGuestOnboarding } from './guest-onboarding';

vi.mock('./auth-proxy', async (original) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typed Vitest factory
  const actual = await original<typeof import('./auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn() };
});
const forward = vi.mocked(forwardToGateway);
const origin = 'http://localhost:3000';
const headers = {
  origin,
  cookie: 'better-auth.session_token=synthetic; guest.c1rcle.csrf=synthetic-csrf',
  'x-csrf-token': 'synthetic-csrf',
  'content-type': 'application/json',
};
function request(body: unknown, extra: Record<string, string> = {}) {
  return new NextRequest(`${origin}/api/onboarding`, {
    method: 'PUT',
    headers: { ...headers, ...extra },
    body: JSON.stringify(body),
  });
}
beforeEach(() => vi.clearAllMocks());
describe('private onboarding BFF', () => {
  it('requires session, same origin and CSRF before writing', async () => {
    expect(
      (await proxyGuestOnboarding(request({ displayName: 'Guest' }, { cookie: '' }), 'save'))
        .status,
    ).toBe(401);
    expect(
      (
        await proxyGuestOnboarding(
          request({ displayName: 'Guest' }, { origin: 'https://attacker.example' }),
          'save',
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await proxyGuestOnboarding(
          request({ displayName: 'Guest' }, { 'x-csrf-token': 'wrong' }),
          'save',
        )
      ).status,
    ).toBe(403);
    expect(forward).not.toHaveBeenCalled();
  });
  it('never accepts client-supplied verification or account identity', async () => {
    expect(
      (await proxyGuestOnboarding(request({ phoneVerified: true, userId: 'other' }), 'save'))
        .status,
    ).toBe(422);
    expect(forward).not.toHaveBeenCalled();
  });
  it('forwards only the caller cookie and validated progress', async () => {
    forward.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await proxyGuestOnboarding(request({ displayName: 'Guest' }), 'save');
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(forward).toHaveBeenCalledWith('/api/v2/profile/onboarding', {
      method: 'PUT',
      body: { displayName: 'Guest' },
      cookie: headers.cookie,
    });
  });
});
