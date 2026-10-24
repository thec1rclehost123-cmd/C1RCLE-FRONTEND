import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectedPartnerEventScreen } from './ConnectedPartnerEventScreen';

import type { EventOperationsDto } from '@c1rcle/contracts';

const mocks = vi.hoisted(() => ({
  cancelPartnerEvent: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/lib/events/venue-event-repository', () => ({
  cancelPartnerEvent: mocks.cancelPartnerEvent,
}));

const event: EventOperationsDto = {
  id: 'evt_internal_m3_123',
  organizationId: 'org_m3',
  venueId: 'venue_m3',
  slug: 'm3-test-event',
  title: 'M3 test event',
  summary: 'An isolated acceptance event',
  description: 'Details for the test event.',
  imageUrl: null,
  startAt: '2026-12-30T13:30:00.000Z',
  endAt: '2026-12-30T17:30:00.000Z',
  status: 'published',
  isPublic: true,
  tags: [],
  startingPricePaise: 10_000,
  isFree: false,
  cancellationReason: null,
  compensation: null,
  version: 1,
  createdAt: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
  capacity: null,
  venueName: 'M3 test venue',
  ticketsSold: 0,
  salesCountComplete: true,
};

describe('ConnectedPartnerEventScreen', () => {
  beforeEach(() => {
    mocks.cancelPartnerEvent.mockReset();
    mocks.refresh.mockReset();
  });

  it('does not render the internal event ID', () => {
    render(<ConnectedPartnerEventScreen event={event} organizationId="org_m3" studio="host" />);

    expect(screen.getByRole('heading', { name: 'M3 test event' })).toBeInTheDocument();
    expect(screen.getByText('M3 test venue')).toBeInTheDocument();
    expect(screen.queryByText('Event ID')).not.toBeInTheDocument();
    expect(screen.queryByText(event.id)).not.toBeInTheDocument();
  });

  it('requires an explicit reason and confirms cancellation through the connected action', async () => {
    mocks.cancelPartnerEvent.mockResolvedValueOnce({ ...event, status: 'cancelled' });
    render(<ConnectedPartnerEventScreen event={event} organizationId="org_m3" studio="host" />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel event' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      /removes the event from public listings/i,
    );
    expect(screen.getByRole('button', { name: 'Confirm cancellation' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Cancellation reason'), {
      target: { value: 'M3 isolated cancellation workflow test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));

    await waitFor(() => {
      expect(mocks.cancelPartnerEvent).toHaveBeenCalledOnce();
    });
    expect(mocks.cancelPartnerEvent).toHaveBeenCalledWith(
      'org_m3',
      'evt_internal_m3_123',
      'M3 isolated cancellation workflow test',
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(await screen.findByRole('status')).toHaveTextContent(/cancellation submitted/i);
  });

  it('focuses and traps the cancellation dialog, then restores focus when dismissed with Escape', async () => {
    render(<ConnectedPartnerEventScreen event={event} organizationId="org_m3" studio="host" />);
    const trigger = screen.getByRole('button', { name: 'Cancel event' });

    fireEvent.click(trigger);
    const reason = screen.getByLabelText('Cancellation reason');
    await waitFor(() => expect(reason).toHaveFocus());

    const confirm = screen.getByRole('button', { name: 'Confirm cancellation' });
    confirm.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(reason).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(mocks.cancelPartnerEvent).not.toHaveBeenCalled();
  });

  it('reuses the same cancellation idempotency key after an ambiguous request failure', async () => {
    mocks.cancelPartnerEvent
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce({ ...event, status: 'cancelled' });
    render(<ConnectedPartnerEventScreen event={event} organizationId="org_m3" studio="host" />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel event' }));
    fireEvent.change(screen.getByLabelText('Cancellation reason'), {
      target: { value: 'M3 isolated cancellation workflow test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/temporary network failure/i);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));

    await waitFor(() => {
      expect(mocks.cancelPartnerEvent).toHaveBeenCalledTimes(2);
    });
    expect(mocks.cancelPartnerEvent.mock.calls[0]?.[3]).toBe(
      mocks.cancelPartnerEvent.mock.calls[1]?.[3],
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('does not offer cancellation for terminal events', () => {
    render(
      <ConnectedPartnerEventScreen
        event={{ ...event, status: 'cancelled' }}
        organizationId="org_m3"
        studio="host"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Cancel event' })).not.toBeInTheDocument();
  });
});
