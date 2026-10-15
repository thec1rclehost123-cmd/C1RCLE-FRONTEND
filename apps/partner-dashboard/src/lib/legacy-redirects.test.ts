import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';

/**
 * H2 guard — the legacy `/venue`, `/host`, `/promoter` and `/partner-network`
 * trees are redirected into the V3 `/partner/[studio]` namespace by
 * `next.config.ts`. The order of these rules is load-bearing (first match
 * wins), so this test pins both the individual mappings and the fact that the
 * shape exceptions precede the role-wide wildcards.
 */
const redirects = (await nextConfig.redirects?.()) ?? [];

const find = (source: string) => redirects.find((rule) => rule.source === source);

const expectedMappings: readonly (readonly [string, string])[] = [
  ['/venue/events/analytics', '/partner/venue/analytics'],
  ['/venue/events/:eventId/finance', '/partner/venue/events/:eventId'],
  ['/venue/events/:eventId/marketing', '/partner/venue/events/:eventId'],
  ['/venue/finance/orders', '/partner/venue/finance'],
  ['/venue/notifications', '/partner/venue/overview'],
  ['/host/events/invitations', '/partner/host/events'],
  ['/host/events/invitations/:invitationId', '/partner/host/events'],
  ['/host/events/requests/:requestId', '/partner/host/events'],
  ['/host/events/:eventId/earnings', '/partner/host/events/:eventId'],
  ['/host/events/:eventId/marketing', '/partner/host/events/:eventId'],
  ['/host/finance/orders', '/partner/host/finance'],
  ['/host/notifications', '/partner/host/overview'],
  ['/host/partners/promoters/:promoterId', '/partner/host/partners'],
  ['/host/partners/venues/:venueId', '/partner/host/partners'],
  ['/promoter/finance/orders', '/partner/promoter/finance'],
  ['/promoter/links', '/partner/promoter/overview'],
  ['/partner-network', '/partner'],
  ['/partner-network/:path*', '/partner'],
  ['/venue', '/partner/venue'],
  ['/host', '/partner/host'],
  ['/promoter', '/partner/promoter'],
  ['/venue/:path*', '/partner/venue/:path*'],
  ['/host/:path*', '/partner/host/:path*'],
  ['/promoter/:path*', '/partner/promoter/:path*'],
];

describe('legacy → V3 redirects (H2)', () => {
  it.each(expectedMappings)('maps %s → %s', (source, destination) => {
    expect(find(source)).toMatchObject({ source, destination, permanent: false });
  });

  it('never issues a cacheable (308) redirect', () => {
    expect(redirects.every((rule) => rule.permanent === false)).toBe(true);
  });

  it('checks shape exceptions before the role-wide wildcards', () => {
    const firstWildcard = redirects.findIndex((rule) => rule.source.endsWith('/:path*'));
    expect(firstWildcard).toBeGreaterThan(-1);

    for (const [source] of expectedMappings) {
      const isWildcard = source.endsWith('/:path*');
      const isBareRoot = source.lastIndexOf('/') === 0;
      if (isWildcard || isBareRoot) continue;
      expect(redirects.findIndex((rule) => rule.source === source)).toBeLessThan(firstWildcard);
    }
  });
});
