import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectedEventEditScreen } from './ConnectedEventEditScreen';

import type { EventOperationsDto } from '@c1rcle/contracts';

const updateEvent = vi.hoisted(() => vi.fn());

vi.mock('@/lib/events/venue-event-repository', () => ({
  updatePartnerEventDetails: updateEvent,
}));

const event: EventOperationsDto = {
  id: 'evt_m3',
  organizationId: 'org_m3',
  venueId: 'venue_m3',
  slug: 'm3-test-event',
  title: 'M3 test event',
  summary: 'Original summary',
  description: 'Original description',
  imageUrl: null,
  startAt: '2026-12-30T13:30:00.000Z',
  endAt: '2026-12-30T17:30:00.000Z',
  status: 'published',
  isPublic: true,
  tags: [],
  startingPricePaise: 100,
  isFree: false,
  cancellationReason: null,
  compensation: null,
  version: 4,
  createdAt: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
  capacity: null,
  venueName: 'M3 test venue',
  ticketsSold: 0,
  salesCountComplete: true,
};

beforeEach(() => {
  updateEvent.mockReset();
});

describe('ConnectedEventEditScreen', () => {
  it('saves only event-copy fields and confirms the authoritative result', async () => {
    updateEvent.mockResolvedValueOnce({
      ...event,
      title: 'M3 test event updated',
      version: 5,
    });

    render(<ConnectedEventEditScreen event={event} organizationId="org_m3" studio="venue" />);
    fireEvent.change(screen.getByLabelText('Event title'), {
      target: { value: 'M3 test event updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledOnce();
    });
    expect(updateEvent).toHaveBeenCalledWith('org_m3', 'evt_m3', 4, {
      title: 'M3 test event updated',
      summary: 'Original summary',
      description: 'Original description',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Event details saved.');
    expect(screen.getByLabelText('Event title')).toHaveValue('M3 test event updated');
    expect(
      screen.getByText(/Dates, ticket tiers, and promoter terms are not changed/),
    ).toBeVisible();
  });

  it('disables save when the title contains no non-whitespace text', () => {
    render(<ConnectedEventEditScreen event={event} organizationId="org_m3" studio="venue" />);
    fireEvent.change(screen.getByLabelText('Event title'), { target: { value: '   ' } });

    expect(screen.getByRole('button', { name: 'Save details' })).toBeDisabled();
    expect(updateEvent).not.toHaveBeenCalled();
  });
});
