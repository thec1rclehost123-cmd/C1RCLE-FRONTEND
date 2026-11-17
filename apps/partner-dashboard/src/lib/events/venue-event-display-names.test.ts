import { describe, expect, it } from 'vitest';

import { resolveVenueEventDisplayNames } from './venue-event-display-names';

import type { PartnershipDto } from '@c1rcle/contracts';

const partnership = (overrides: Partial<PartnershipDto> = {}): PartnershipDto => ({
  id: 'partnership-1',
  hostOrganizationId: 'host-org-1',
  venueOrganizationId: 'venue-org-1',
  venueId: 'venue-1',
  initiatedBy: 'host',
  status: 'active',
  message: null,
  venueShareRate: null,
  resolutionReason: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-11-10T00:00:00.000Z',
  updatedAt: '2026-11-10T00:00:00.000Z',
  hostName: 'Test Host',
  venueName: 'Test Venue',
  ...overrides,
});

describe('resolveVenueEventDisplayNames', () => {
  it('resolves names only from the matching Host and Venue relationship', () => {
    const unrelated = partnership({
      id: 'partnership-other-venue',
      venueId: 'venue-other',
      venueName: 'Other Venue',
    });

    expect(
      resolveVenueEventDisplayNames({ organizationId: 'host-org-1', venueId: 'venue-1' }, [
        unrelated,
        partnership(),
      ]),
    ).toEqual({ hostName: 'Test Host', venueName: 'Test Venue' });
  });

  it('does not substitute names from a different Host or expose identifiers as names', () => {
    expect(
      resolveVenueEventDisplayNames({ organizationId: 'host-org-1', venueId: 'venue-1' }, [
        partnership({ hostOrganizationId: 'host-org-other', hostName: 'Other Host' }),
      ]),
    ).toEqual({ hostName: null, venueName: null });
  });
});
