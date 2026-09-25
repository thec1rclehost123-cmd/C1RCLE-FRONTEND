/* eslint-disable no-restricted-syntax -- the environment loader is what is under test here. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EnvironmentValidationError,
  getClientEnv,
  getServerEnv,
  resetEnvCacheForTests,
} from './env.js';

const VALID = {
  NEXT_PUBLIC_API_BASE_URL: 'https://api.c1rcle.test',
  NEXT_PUBLIC_APP_NAME: 'Guest Portal',
  NEXT_PUBLIC_APP_ID: 'guest',
  NEXT_PUBLIC_ENVIRONMENT: 'development',
} as const;

describe('getClientEnv', () => {
  beforeEach(() => {
    resetEnvCacheForTests();
    Object.assign(process.env, VALID);
  });

  afterEach(() => {
    resetEnvCacheForTests();
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  });

  it('returns typed values for a valid environment', () => {
    expect(getClientEnv().NEXT_PUBLIC_APP_NAME).toBe('Guest Portal');
    expect(getClientEnv().NEXT_PUBLIC_ENVIRONMENT).toBe('development');
  });

  it('fails startup when a required variable is missing', () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    resetEnvCacheForTests();

    expect(() => getClientEnv()).toThrow(EnvironmentValidationError);
  });

  it('fails startup when a URL is not absolute', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = '/api';
    resetEnvCacheForTests();

    expect(() => getClientEnv()).toThrow(/must be an absolute URL/);
  });

  it('rejects an unknown environment name', () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'staging';
    resetEnvCacheForTests();

    expect(() => getClientEnv()).toThrow(EnvironmentValidationError);
  });

  it('caches after the first successful parse', () => {
    const first = getClientEnv();
    process.env.NEXT_PUBLIC_APP_NAME = 'Changed';

    expect(getClientEnv()).toBe(first);
  });
});

describe('getServerEnv', () => {
  beforeEach(() => {
    resetEnvCacheForTests();
    delete process.env.SITE_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    delete process.env.ANALYZE;
  });

  afterEach(() => {
    resetEnvCacheForTests();
    delete process.env.SITE_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    delete process.env.ANALYZE;
    vi.unstubAllGlobals();
  });

  it('returns typed values for a valid server environment', () => {
    const env = getServerEnv();

    expect(env.ANALYZE).toBe(false);
    expect(env.SITE_URL).toBeUndefined();
    expect(env.VERCEL_ENV).toBeUndefined();
  });

  it('reads the optional server-only values when present', () => {
    process.env.SITE_URL = 'https://c1rcle.app';
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'c1rcle-app-git-main.vercel.app';
    resetEnvCacheForTests();

    const env = getServerEnv();

    expect(env.SITE_URL).toBe('https://c1rcle.app');
    expect(env.VERCEL_ENV).toBe('preview');
    expect(env.VERCEL_URL).toBe('c1rcle-app-git-main.vercel.app');
  });

  it('transforms the ANALYZE flag into a boolean', () => {
    process.env.ANALYZE = 'true';
    resetEnvCacheForTests();
    expect(getServerEnv().ANALYZE).toBe(true);

    process.env.ANALYZE = 'false';
    resetEnvCacheForTests();
    expect(getServerEnv().ANALYZE).toBe(false);
  });

  it('caches after the first successful parse', () => {
    const first = getServerEnv();
    process.env.SITE_URL = 'https://changed.app';

    expect(getServerEnv()).toBe(first);
  });

  it('fails when a server-only value is malformed', () => {
    process.env.VERCEL_ENV = 'staging';
    resetEnvCacheForTests();

    expect(() => getServerEnv()).toThrow(EnvironmentValidationError);
  });

  it('throws when called in a browser-like environment', () => {
    vi.stubGlobal('window', {});
    resetEnvCacheForTests();

    expect(() => getServerEnv()).toThrow(/getServerEnv\(\) was called in the browser/);
  });
});
