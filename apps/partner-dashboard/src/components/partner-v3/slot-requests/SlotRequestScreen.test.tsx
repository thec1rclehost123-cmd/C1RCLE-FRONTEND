import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { SlotRequestScreen } from './SlotRequestScreen';

const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/venue/slot-requests',
  useRouter: () => ({ push, replace }),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    BackIcon: Icon,
    CalendarIcon: Icon,
    CloseIcon: Icon,
    LocationIcon: Icon,
    MobileAppIcon: Icon,
    RefreshIcon: Icon,
    TicketIcon: Icon,
    TimeIcon: Icon,
  };
});

const { applySlotRequestAction } = vi.hoisted(() => ({
  applySlotRequestAction: vi.fn<() => Promise<void>>(),
}));

vi.mock('@/lib/slot-requests/slot-request-repository', () => ({
  loadSlotRequestsData: async (direction: 'incoming' | 'outgoing') =>
    direction === 'incoming'
      ? fixturePartnerDataSource.getVenueSlotRequests()
      : fixturePartnerDataSource.getHostSlotRequests(),
  applySlotRequestAction,
}));

describe('SlotRequestScreen', () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    applySlotRequestAction.mockReset();
  });

  it('renders Venue incoming requests from live data and offers accepted decisions', async () => {
    const user = userEvent.setup();
    render(<SlotRequestScreen direction="incoming" />);

    expect(await screen.findByRole('heading', { name: 'Slot Requests' })).toBeInTheDocument();
    expect(screen.getByText('Requested by Arjun (Pulse Collective)')).toBeInTheDocument();
    expect(screen.getByText('Requested by Zoya (Nightowl)')).toBeInTheDocument();
    const acceptButtons = screen.getAllByRole('button', { name: 'Accept' });
    expect(acceptButtons).toHaveLength(2);
    expect(acceptButtons[0]).not.toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Bassline Nights/ }));
    expect(push).toHaveBeenCalledWith('/partner/venue/slot-requests?request=venue-slot-bassline');
  });

  it('renders Host outgoing language and exposes cancellation only on approved requests', async () => {
    render(<SlotRequestScreen direction="outgoing" initialView="all" />);

    expect(await screen.findAllByText('Sent to Skyline Rooftop')).toHaveLength(3);
    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel request' });
    expect(cancelButtons).toHaveLength(1);
    expect(cancelButtons[0]).not.toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
  });

  it('renders a directly addressed request review and changes preview state in the URL', async () => {
    const user = userEvent.setup();
    const view = render(<SlotRequestScreen direction="incoming" initialRequestId="venue-slot-bassline" />);

    expect(await screen.findByRole('dialog', { name: 'Bassline Nights' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Live preview' }));
    expect(replace).toHaveBeenLastCalledWith('/partner/venue/slot-requests?request=venue-slot-bassline&panel=preview');
    view.rerender(<SlotRequestScreen direction="incoming" initialRequestId="venue-slot-bassline" initialPanel="preview" />);
    await user.click(screen.getByRole('button', { name: 'Mobile app' }));
    expect(replace).toHaveBeenLastCalledWith('/partner/venue/slot-requests?request=venue-slot-bassline&panel=preview&preview=mobile');
  });
});