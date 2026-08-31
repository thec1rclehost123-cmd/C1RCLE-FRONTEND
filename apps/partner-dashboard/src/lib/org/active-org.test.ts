import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetEnvCacheForTests } from '@c1rcle/config';

import { getActiveOrgId, getActiveOrgIdFromCookieHeader, setActiveOrg } from './active-org';

vi.mock('@c1rcle/auth', () => ({
  refresh: vi.fn().mockResolvedValue(true),
}));

afterEach(() => {
  document.cookie = 'c1rcle.active-org=; path=/; max-age=0';
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetEnvCacheForTests();
});

describe('active-org', () => {
  it('sets and clears c1rcle.active-org cookie', async () => {
    await setActiveOrg('org-123');
    expect(document.cookie).toContain('c1rcle.active-org=org-123');
    expect(getActiveOrgId()).toBe('org-123');

    await setActiveOrg(null);
    expect(getActiveOrgId()).toBeNull();
  });

  it('does not set Secure in development', async () => {
    const setCookieSpy = vi.spyOn(document, 'cookie', 'set');
    await setActiveOrg('org-dev');
    expect(setCookieSpy.mock.calls.at(-1)?.[0]).not.toContain('Secure');
  });

  it('sets Secure when NEXT_PUBLIC_ENVIRONMENT is production', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'production');
    resetEnvCacheForTests();

    const setCookieSpy = vi.spyOn(document, 'cookie', 'set');
    await setActiveOrg('org-prod');
    expect(setCookieSpy.mock.calls.at(-1)?.[0]).toContain('Secure');
  });

  it('parses the active org id out of a raw cookie header', () => {
    expect(getActiveOrgIdFromCookieHeader('c1rcle.active-org=org-abc')).toBe('org-abc');
    expect(
      getActiveOrgIdFromCookieHeader('other=1; c1rcle.active-org=org-xyz; another=2'),
    ).toBe('org-xyz');
    expect(getActiveOrgIdFromCookieHeader('other=1')).toBeNull();
    expect(getActiveOrgIdFromCookieHeader('')).toBeNull();
  });

  it('URL-decodes the cookie value from the header', () => {
    expect(getActiveOrgIdFromCookieHeader('c1rcle.active-org=org%20abc')).toBe('org abc');
  });
});
