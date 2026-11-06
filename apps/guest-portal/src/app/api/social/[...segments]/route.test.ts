import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { GET, POST, PUT } from './route';

vi.mock('@/lib/bff/auth-proxy', async (original) => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ...(await original<typeof import('@/lib/bff/auth-proxy')>()),
  forwardToGateway: vi.fn(),
}));
const forward = vi.mocked(forwardToGateway);
const flags = { profileVisible: true, showOnGuestlists: false, showUpcomingEvents: false };
function request(method = 'GET', body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/social/privacy', {
    method,
    headers: {
      origin: 'http://localhost:3000',
      cookie: 'better-auth.session_token=synthetic; guest.c1rcle.csrf=token',
      'x-csrf-token': 'token',
      'content-type': 'application/json',
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const context = (segments = ['privacy']) => ({ params: Promise.resolve({ segments }) });
beforeEach(() => forward.mockReset());
describe('Social BFF privacy boundary', () => {
  it('requires native session, same origin and CSRF on writes', async () => {
    expect((await GET(request('GET', undefined, { cookie: '' }), context())).status).toBe(401);
    expect(
      (await PUT(request('PUT', flags, { origin: 'https://outside.invalid' }), context())).status,
    ).toBe(403);
    expect((await PUT(request('PUT', flags, { 'x-csrf-token': 'wrong' }), context())).status).toBe(
      403,
    );
    expect(forward).not.toHaveBeenCalled();
  });
  it('rejects mass assignment and unknown proxy destinations', async () => {
    expect((await PUT(request('PUT', { ...flags, userId: 'other' }), context())).status).toBe(422);
    expect((await GET(request(), context(['users', 'private']))).status).toBe(404);
    expect(forward).not.toHaveBeenCalled();
  });
  it('validates upstream DTOs and marks both success and failure private/no-store', async () => {
    forward.mockResolvedValueOnce(Response.json({ ...flags, blockedUsers: [], hiddenEvents: [] }));
    const ok = await GET(request(), context());
    expect(ok.status).toBe(200);
    expect(ok.headers.get('cache-control')).toBe('private, no-store');
    forward.mockResolvedValueOnce(
      Response.json({
        ...flags,
        blockedUsers: [],
        hiddenEvents: [],
        email: 'private@example.invalid',
      }),
    );
    const fail = await PUT(request('PUT', flags), context());
    expect(fail.status).toBe(502);
    expect(fail.headers.get('cache-control')).toBe('private, no-store');
    expect(await fail.text()).not.toContain('private@example.invalid');
  });
  it('requires report idempotency and validates mutation receipts', async () => {
    const report = { category: 'safety', reason: 'Synthetic report reason.' };
    expect((await POST(request('POST', report), context(['reports', 'guest-b']))).status).toBe(422);
    forward.mockResolvedValueOnce(Response.json({ email: 'private@example.invalid' }));
    expect(
      (await PUT(request('PUT', { blocked: true }), context(['blocks', 'guest-b']))).status,
    ).toBe(502);
  });
});
