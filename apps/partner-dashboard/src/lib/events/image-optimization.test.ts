import { describe, expect, it } from 'vitest';

import { shouldBypassEventImageOptimizer } from './image-optimization';

describe('shouldBypassEventImageOptimizer', () => {
  it('loads browser-local poster previews directly from their blob URL', () => {
    expect(shouldBypassEventImageOptimizer('blob:https://staging.thec1rcle.com/poster-id')).toBe(
      true,
    );
  });

  it('bypasses the optimizer for public Firebase poster objects in any configured bucket', () => {
    expect(
      shouldBypassEventImageOptimizer(
        'https://storage.googleapis.com/staging-bucket/posters/org_1/event.webp',
      ),
    ).toBe(true);
  });

  it('does not bypass the optimizer for other storage objects or hosts', () => {
    expect(
      shouldBypassEventImageOptimizer('https://storage.googleapis.com/staging-bucket/kyc/id.jpg'),
    ).toBe(false);
    expect(shouldBypassEventImageOptimizer('https://cdn.example.com/poster.webp')).toBe(false);
  });
});
