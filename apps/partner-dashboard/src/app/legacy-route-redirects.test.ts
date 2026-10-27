import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';

describe('legacy partner route redirects', () => {
  it('maps finance order deep links to the connected orders view', async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toContainEqual({
      source: '/venue/finance/orders',
      destination: '/partner/venue/finance?view=orders',
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: '/host/finance/orders',
      destination: '/partner/host/finance?view=orders',
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: '/promoter/finance/orders',
      destination: '/partner/promoter/finance?view=orders',
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: '/partner/venue/finance/orders',
      destination: '/partner/venue/finance?view=orders',
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: '/partner/host/finance/orders',
      destination: '/partner/host/finance?view=orders',
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: '/partner/promoter/finance/orders',
      destination: '/partner/promoter/finance?view=orders',
      permanent: false,
    });
  });

  it('maps organization analytics deep links to connected analytics screens', async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toContainEqual({
      source: '/venue/events/analytics',
      destination: '/partner/venue/analytics',
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: '/host/events/analytics',
      destination: '/partner/host/analytics',
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: '/partner/venue/events/analytics',
      destination: '/partner/venue/analytics',
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: '/partner/host/events/analytics',
      destination: '/partner/host/analytics',
      permanent: false,
    });
  });
});
