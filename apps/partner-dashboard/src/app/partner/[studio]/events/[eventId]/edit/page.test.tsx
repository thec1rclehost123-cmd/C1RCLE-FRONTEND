import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StudioEventEditPage from './page';

const mocks = vi.hoisted(() => ({
  loadVenueEventDetail: vi.fn(),
  loadPartnerEvent: vi.fn(),
  loadPartnerEventTiers: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ toString: () => 'c1rcle.active-org=venue-org' }),
}));
vi.mock('@/lib/events/load-venue-event-detail', () => ({
  loadVenueEventDetail: mocks.loadVenueEventDetail,
}));
vi.mock('@/lib/events/load-partner-event', () => ({
  loadPartnerEvent: mocks.loadPartnerEvent,
}));
vi.mock('@/lib/events/load-partner-event-tiers', () => ({
  loadPartnerEventTiers: mocks.loadPartnerEventTiers,
}));
vi.mock('@/components/partner-v3/event-detail/ConnectedEventEditScreen', () => ({
  ConnectedEventEditScreen: () => <h1>Edit event</h1>,
}));

describe('Venue event edit route', () => {
  beforeEach(() => vi.clearAllMocks());

  const params = Promise.resolve({ studio: 'venue', eventId: 'venue-associated-event' });

  it('keeps a Host-owned event read only and avoids the owner data loader', async () => {
    mocks.loadVenueEventDetail.mockResolvedValue({ event: { ownerType: 'host' } });

    render(await StudioEventEditPage({ params }));

    expect(screen.getByText('Host event is view only')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Edit event' })).not.toBeInTheDocument();
    expect(mocks.loadPartnerEvent).not.toHaveBeenCalled();
    expect(mocks.loadPartnerEventTiers).not.toHaveBeenCalled();
  });

  it('reaches the editor for a Venue-owned event', async () => {
    mocks.loadVenueEventDetail.mockResolvedValue({ event: { ownerType: 'venue' } });
    mocks.loadPartnerEvent.mockResolvedValue({ id: 'venue-associated-event' });

    render(await StudioEventEditPage({ params }));

    expect(screen.getByRole('heading', { name: 'Edit event' })).toBeInTheDocument();
    expect(mocks.loadPartnerEvent).toHaveBeenCalledWith('venue-associated-event');
  });
});
