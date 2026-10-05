import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ApiClientError } from '@c1rcle/api-client';

import { describeApiError } from './describe-error';

describe('describeApiError', () => {
  it('appends gateway 422 field errors to the message', () => {
    const error = new ApiClientError({
      code: 'validation',
      message: 'Request validation failed.',
      status: 422,
      requestId: undefined,
      fieldErrors: { title: ['Required'], startAt: ['Invalid date'] },
    });
    expect(describeApiError(error, 'fallback')).toBe(
      'Request validation failed. (title: Required; startAt: Invalid date)',
    );
  });

  it('reduces a ZodError to its first issue', () => {
    const result = z.object({ name: z.string().min(1) }).safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(describeApiError(result.error, 'fallback')).toMatch(/^name: /);
    }
  });

  it('falls back for non-errors', () => {
    expect(describeApiError('boom', 'fallback')).toBe('fallback');
  });
});
