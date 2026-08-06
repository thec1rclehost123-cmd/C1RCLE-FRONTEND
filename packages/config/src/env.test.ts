/* eslint-disable no-restricted-syntax -- the environment loader is what is under test here. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EnvironmentValidationError, getClientEnv, resetEnvCacheForTests } from './env.js';

const VALID = {
  NEXT_PUBLIC_API_BASE_URL: 'https://api.c1rcle.test',
  NEXT_PUBLIC_APP_NAME: 'Guest Portal',
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
