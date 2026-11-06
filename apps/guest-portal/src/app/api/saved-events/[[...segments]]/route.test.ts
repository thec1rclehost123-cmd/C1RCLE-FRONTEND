import { NextRequest } from 'next/server';
import { beforeEach, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { GET, PUT } from './route';

vi.mock('@/lib/bff/auth-proxy', async (original) => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ...(await original<typeof import('@/lib/bff/auth-proxy')>()),
  forwardToGateway: vi.fn(),
}));
const forward = vi.mocked(forwardToGateway);
const context = { params: Promise.resolve({ segments: ['event-a'] }) };
function req(method = 'GET', body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/saved-events/event-a', {
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
beforeEach(() => forward.mockReset());
it('requires native session, same origin and CSRF; rejects client ownership', async () => {
  expect((await GET(req('GET', undefined, { cookie: '' }), context)).status).toBe(401);
  expect(
    (await PUT(req('PUT', { saved: true }, { origin: 'https://outside.invalid' }), context)).status,
  ).toBe(403);
  expect(
    (await PUT(req('PUT', { saved: true }, { 'x-csrf-token': 'wrong' }), context)).status,
  ).toBe(403);
  expect((await PUT(req('PUT', { saved: true, userId: 'guest-b' }), context)).status).toBe(422);
  expect(forward).not.toHaveBeenCalled();
});
it('validates upstream data and keeps success/error responses private', async () => {
  forward.mockResolvedValueOnce(Response.json({ saved: true }));
  const ok = await PUT(req('PUT', { saved: true }), context);
  expect(ok.status).toBe(200);
  expect(ok.headers.get('cache-control')).toBe('private, no-store');
  forward.mockResolvedValueOnce(Response.json({ saved: true, email: 'private@example.invalid' }));
  const error = await GET(req(), context);
  expect(error.status).toBe(502);
  expect(error.headers.get('cache-control')).toBe('private, no-store');
  expect(await error.text()).not.toContain('private@example.invalid');
});
