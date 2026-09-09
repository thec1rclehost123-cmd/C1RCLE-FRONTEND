// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetEnvCacheForTests } from '@c1rcle/config';

import { proxy } from './proxy';

function configure(environment: 'development' | 'preview' | 'production') {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.c1rcle.test');
  vi.stubEnv('NEXT_PUBLIC_APP_NAME', 'C1RCLE Guest Portal');
  vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', environment);
  resetEnvCacheForTests();
}

afterEach(() => {
  vi.unstubAllEnvs();
  resetEnvCacheForTests();
});

describe('Guest Portal proxy', () => {
  it('redirects unauthenticated private routes to a clean login return path', () => {
    configure('production');
    const response = proxy(new NextRequest('https://thec1rcle.com/profile?view=settings'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://thec1rcle.com/login?next=%2Fprofile');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, follow, noarchive');
  });

  it('protects private HEAD requests used by crawlers and link checkers', () => {
    configure('production');
    const response = proxy(new NextRequest('https://thec1rcle.com/tickets', { method: 'HEAD' }));
    expect(response.status).toBe(307);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('marks authenticated private responses private and noindex', () => {
    configure('production');
    const response = proxy(
      new NextRequest('https://thec1rcle.com/tickets', {
        headers: { cookie: 'better-auth.session_token=test-session' },
      }),
    );
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, follow, noarchive');
  });

  it('marks every preview response noindex, nofollow and noarchive', () => {
    configure('preview');
    const response = proxy(new NextRequest('https://guest-preview.vercel.app/explore'));
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
  });

  it('lets Vercel preview state override a stale public production setting', () => {
    configure('production');
    vi.stubEnv('VERCEL_ENV', 'preview');
    resetEnvCacheForTests();
    const response = proxy(new NextRequest('https://guest-preview.vercel.app/explore'));
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
  });

  it('keeps private preview routes nofollow even when a session cookie exists', () => {
    configure('preview');
    const response = proxy(
      new NextRequest('https://guest-preview.vercel.app/tickets', {
        headers: { cookie: 'better-auth.session_token=test-session' },
      }),
    );
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
  });

  it('permanently normalizes the production host and protocol', () => {
    configure('production');
    const response = proxy(new NextRequest('http://www.thec1rcle.com/explore'));
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://thec1rcle.com/explore');
  });
});
