import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CalendarDayDetails } from './CalendarDayDetails';

import type { CalendarBlock, CalendarDay } from '@/data/partner-data-source';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { EmptyDateIcon: Icon, LocationIcon: Icon, LockedIcon: Icon, TimeIcon: Icon };
});

const day: CalendarDay = {
  date: '2026-11-30',
  day: 30,
  state: 'blocked',
  events: [],
  slots: [],
};

const block: CalendarBlock = {
  id: 'm3-e2e-nov-30',
  date: day.date,
  reason: 'M3 E2E reversible calendar block test',
  from: '2026-11-30T19:00:00.000Z',
  to: '2026-11-30T23:00:00.000Z',
};

describe('CalendarDayDetails unblock action', () => {
  it('does not label an unavailable Host date as open for requests', () => {
    render(
      <CalendarDayDetails day={{ ...day, state: 'unavailable' }} accent="lavender" mode="host" />,
    );

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('No open time slots are available for this date.')).toBeInTheDocument();
    expect(screen.queryByText('Open for requests')).not.toBeInTheDocument();
  });

  it('prevents duplicate clicks while an unblock request is pending', async () => {
    const user = userEvent.setup();
    let resolveUnblock: (() => void) | undefined;
    const onUnblock = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUnblock = resolve;
        }),
    );
    render(
      <CalendarDayDetails
        day={day}
        block={block}
        accent="orange"
        mode="venue"
        onUnblock={onUnblock}
      />,
    );

    const button = screen.getByRole('button', { name: 'Unblock date' });
    await user.click(button);
    expect(await screen.findByRole('button', { name: 'Unblocking…' })).toBeDisabled();
    expect(onUnblock).toHaveBeenCalledTimes(1);

    resolveUnblock?.();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Unblock date' })).toBeEnabled());
  });

  it('shows a retryable error when the request fails', async () => {
    const user = userEvent.setup();
    const onUnblock = vi.fn().mockRejectedValueOnce(new Error('network unavailable'));
    render(
      <CalendarDayDetails
        day={day}
        block={block}
        accent="orange"
        mode="venue"
        onUnblock={onUnblock}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Unblock date' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to unblock this date. Please try again.',
    );
    expect(screen.getByRole('button', { name: 'Unblock date' })).toBeEnabled();
  });

  it('keeps the action disabled when no authorized mutation is supplied', () => {
    render(<CalendarDayDetails day={day} block={block} accent="orange" mode="venue" />);
    expect(screen.getByRole('button', { name: 'Unblock date' })).toBeDisabled();
  });
});

describe('Host requestable availability', () => {
  it('sends a selected published slot once and disables duplicate clicks while pending', async () => {
    const user = userEvent.setup();
    let resolveRequest: (() => void) | undefined;
    const onRequestSlot = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const availableDay: CalendarDay = {
      date: '2026-11-06',
      day: 6,
      state: 'available',
      events: [],
      slots: [
        {
          id: 'm3-open-slot',
          label: '6:00 PM–10:00 PM IST',
          status: 'available',
          startTime: '2026-11-06T12:30:00.000Z',
          endTime: '2026-11-06T16:30:00.000Z',
          timezone: 'Asia/Kolkata',
        },
      ],
    };
    render(
      <CalendarDayDetails
        day={availableDay}
        accent="lavender"
        mode="host"
        onSlotSelect={vi.fn()}
        selectedSlotId="m3-open-slot"
        onRequestSlot={onRequestSlot}
      />,
    );
    const button = screen.getByRole('button', { name: 'Request this slot' });
    await user.click(button);
    expect(await screen.findByRole('button', { name: 'Sending request…' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Sending request…' }));
    expect(onRequestSlot).toHaveBeenCalledTimes(1);
    resolveRequest?.();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Request this slot' })).toBeEnabled(),
    );
  });

  it('shows a retryable failure for a Host slot request', async () => {
    const user = userEvent.setup();
    const onRequestSlot = vi.fn().mockRejectedValueOnce(new Error('slot already claimed'));
    const availableDay: CalendarDay = {
      date: '2026-11-06',
      day: 6,
      state: 'available',
      events: [],
      slots: [{ id: 'm3-open-slot', label: '6:00 PM', status: 'available' }],
    };
    render(
      <CalendarDayDetails
        day={availableDay}
        accent="lavender"
        mode="host"
        selectedSlotId="m3-open-slot"
        onRequestSlot={onRequestSlot}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Request this slot' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('slot already claimed');
    expect(screen.getByRole('button', { name: 'Request this slot' })).toBeEnabled();
  });
});

describe('Venue published availability', () => {
  it('shows open slot details instead of an empty date after publishing', () => {
    const availableDay: CalendarDay = {
      date: '2026-11-16',
      day: 16,
      state: 'available',
      events: [],
      slots: [
        {
          id: 'm15-open-slot',
          label: 'Open for Host requests · 7:00 PM IST – 11:00 PM IST',
          status: 'available',
          timezone: 'Asia/Kolkata',
          notes: 'M15-VENUE-E2E-20261030',
        },
      ],
    };

    render(<CalendarDayDetails day={availableDay} accent="orange" mode="venue" />);

    expect(screen.getByRole('region', { name: 'Published availability' })).toBeInTheDocument();
    expect(screen.getByText('Open for Host requests')).toBeInTheDocument();
    expect(screen.getByText(availableDay.slots[0]!.label)).toBeInTheDocument();
    expect(screen.getByText('M15-VENUE-E2E-20261030')).toBeInTheDocument();
    expect(screen.queryByText('Nothing booked')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open this time for Host requests' })).toBeNull();
  });
});
