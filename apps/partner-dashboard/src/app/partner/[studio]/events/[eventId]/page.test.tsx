import { describe, expect, it, vi } from 'vitest';

import StudioEventDetailPage from './page';

const mocks = vi.hoisted(() => ({
  event: { id: 'local-event', organizationId: 'local-org' },
  analytics: { eventId: 'local-event', ticketsSold: 12 },
  tiers: [{ id: 'tier-1', name: 'General Admission' }],
  venue: vi.fn((_input: { params: Promise<{ eventId: string }> }) =>
    Promise.resolve({ props: { venueScoped: true } }),
  ),
}));
vi.mock('@/components/venue/event-detail/VenueAssociatedEventPage', () => ({
  VenueEventSummaryPage: mocks.venue,
}));
vi.mock('@/lib/events/load-partner-event', () => ({
  loadPartnerEvent: vi.fn(() => Promise.resolve(mocks.event)),
}));
vi.mock('@/lib/events/load-partner-event-analytics', () => ({
  loadPartnerEventAnalytics: vi.fn(() => Promise.resolve(mocks.analytics)),
}));
vi.mock('@/lib/events/load-partner-event-tiers', () => ({
  loadPartnerEventTiers: vi.fn(() => Promise.resolve(mocks.tiers)),
}));
vi.mock('@/lib/events/load-promoter-events', () => ({ loadPromoterEvents: vi.fn() }));
vi.mock('@/components/partner-v3/event-detail/ConnectedPartnerEventScreen', () => ({
  ConnectedPartnerEventScreen: () => null,
}));
vi.mock('@/components/promoter/PromoterAssignmentDetailsScreen', () => ({
  PromoterAssignmentDetailsScreen: () => null,
}));
vi.mock('@/components/promoter/PromoterPublicEventDetailsScreen', () => ({
  PromoterPublicEventDetailsScreen: () => null,
}));
vi.mock('../../route-helpers', () => ({ renderStudioSkeleton: vi.fn() }));

describe('event detail studio lifecycle routing', () => {
  it('routes the Studio-generated Venue URL through the Venue-associated reader', async () => {
    const page = await StudioEventDetailPage({
      params: Promise.resolve({ studio: 'venue', eventId: mocks.event.id }),
    });
    expect(page.props).toEqual({ venueScoped: true });
    expect(mocks.venue).toHaveBeenCalledOnce();
    expect(await mocks.venue.mock.calls[0]?.[0]?.params).toEqual({ eventId: mocks.event.id });
  });
  it.each(['host'])('preserves the %s studio for replacement-date controls', async (studio) => {
    const page = await StudioEventDetailPage({
      params: Promise.resolve({ studio, eventId: mocks.event.id }),
    });
    expect(page.props).toMatchObject({ studio, event: mocks.event });
  });
});
