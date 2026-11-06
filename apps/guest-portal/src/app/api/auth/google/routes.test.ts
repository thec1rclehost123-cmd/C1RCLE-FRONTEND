import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { GET as callback } from './callback/route';
import { POST as start } from './route';

vi.mock('@/lib/bff/auth-proxy', async (original) => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typed Vitest mock factory
  ...(await original<typeof import('@/lib/bff/auth-proxy')>()),
  forwardToGateway: vi.fn(),
}));
const forward = vi.mocked(forwardToGateway);
const origin = 'http://localhost:3000';
beforeEach(() => vi.clearAllMocks());
describe('Guest Google BFF', () => {
  it('rejects cross-origin initiation before calling the gateway', async () => {
    expect(
      (
        await start(
          new NextRequest(`${origin}/api/auth/google`, {
            method: 'POST',
            headers: { origin: 'https://attacker.example' },
            body: '{}',
          }),
        )
      ).status,
    ).toBe(403);
    expect(forward).not.toHaveBeenCalled();
  });
  it('sanitizes the return path and scopes native state cookies', async () => {
    forward.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ url: 'https://accounts.google.com/o/oauth2/v2/auth?state=synthetic' }),
        {
          headers: {
            'set-cookie':
              'better-auth.oauth_state=synthetic; HttpOnly; Path=/; Domain=gateway.invalid',
          },
        },
      ),
    );
    const response = await start(
      new NextRequest(`${origin}/api/auth/google`, {
        method: 'POST',
        headers: { origin },
        body: JSON.stringify({ next: 'https://attacker.example' }),
      }),
    );
    expect(response.status).toBe(200);
    expect(forward).toHaveBeenCalledWith('/api/v2/auth/google', {
      method: 'POST',
      body: { next: '/profile' },
      headers: { origin },
    });
    expect(response.headers.get('set-cookie')).toContain('better-auth.oauth_state=synthetic');
    expect(response.headers.get('set-cookie')).not.toContain('Domain=');
  });
  it('forwards state and establishes the ordinary session and CSRF cookies', async () => {
    forward.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: {
          location: `${origin}/profile`,
          'set-cookie': '__Secure-better-auth.session_token=synthetic; HttpOnly; Path=/',
        },
      }),
    );
    const response = await callback(
      new NextRequest(`${origin}/api/auth/google/callback?code=synthetic&state=synthetic`, {
        headers: { cookie: 'better-auth.oauth_state=synthetic' },
      }),
    );
    expect(response.headers.get('location')).toBe(`${origin}/auth/continue?next=%2Fprofile`);
    expect(response.headers.get('set-cookie')).toContain('better-auth.session_token=synthetic');
    expect(response.headers.get('set-cookie')).toContain('guest.c1rcle.csrf=');
    expect(forward.mock.calls[0]?.[1].cookie).toContain(
      '__Secure-better-auth.oauth_state=synthetic',
    );
  });
  it.each(['https://attacker.example/', 'http://localhost:3000/login?error=access_denied'])(
    'masks unsafe/error callback %s',
    async (location) => {
      forward.mockResolvedValueOnce(new Response(null, { status: 302, headers: { location } }));
      const response = await callback(
        new NextRequest(`${origin}/api/auth/google/callback?error=access_denied`),
      );
      expect(response.headers.get('location')).toBe(`${origin}/login?reason=google`);
      expect(response.headers.get('set-cookie')).toBeNull();
    },
  );
});
