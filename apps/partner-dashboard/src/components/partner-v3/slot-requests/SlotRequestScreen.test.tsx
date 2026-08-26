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

describe('SlotRequestScreen', () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
  });

  it('renders Venue incoming requests and opens a review through URL state', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueSlotRequests();
    render(<SlotRequestScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Slot Requests' })).toBeInTheDocument();
    expect(screen.getByText('Requested by Arjun (Pulse Collective)')).toBeInTheDocument();
    expect(screen.getByText('Requested by Zoya (Nightowl)')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Accept' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Accept' })[0]).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Bassline Nights/ }));
    expect(push).toHaveBeenCalledWith('/partner/venue/slot-requests?request=venue-slot-bassline');
  });

  it('renders Host outgoing language and keeps cancellation unavailable', async () => {
    const data = await fixturePartnerDataSource.getHostSlotRequests();
    render(<SlotRequestScreen data={data} />);

    expect(screen.getAllByText('Sent to Skyline Rooftop')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Cancel request' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Cancel request' })[0]).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
  });

  it('renders a directly addressed request review and changes preview state in the URL', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueSlotRequests();
    const view = render(<SlotRequestScreen data={data} initialRequestId="venue-slot-bassline" />);

    expect(screen.getByRole('dialog', { name: 'Bassline Nights' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Live preview' }));
    expect(replace).toHaveBeenLastCalledWith('/partner/venue/slot-requests?request=venue-slot-bassline&panel=preview');
    view.rerender(<SlotRequestScreen data={data} initialRequestId="venue-slot-bassline" initialPanel="preview" />);
    await user.click(screen.getByRole('button', { name: 'Mobile app' }));
    expect(replace).toHaveBeenLastCalledWith('/partner/venue/slot-requests?request=venue-slot-bassline&panel=preview&preview=mobile');
  });
});
