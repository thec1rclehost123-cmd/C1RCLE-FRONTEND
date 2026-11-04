import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EventTimeTimeline } from './EventTimeTimeline';

import type { AvailabilitySlot } from '@/data/partner-data-source';

const slot: AvailabilitySlot = {
  id: 'free-2030-11-16-0',
  label: 'Available',
  status: 'available',
  startTime: '2030-11-15T18:30:00.000Z',
  endTime: '2030-11-17T18:30:00.000Z',
  timezone: 'Asia/Kolkata',
};

describe('Event time timeline', () => {
  it('selects an overnight end using duration and labels the next day', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <EventTimeTimeline
        date="2030-11-16"
        slots={[slot]}
        time="21:00"
        endTime="23:00"
        selectedSlotId={slot.id}
        onSelect={onSelect}
      />,
    );
    fireEvent.change(screen.getByLabelText('Event duration'), { target: { value: '300' } });
    expect(onSelect).toHaveBeenCalledWith(slot, '21:00', '02:00');
    rerender(
      <EventTimeTimeline
        date="2030-11-16"
        slots={[slot]}
        time="21:00"
        endTime="02:00"
        selectedSlotId={slot.id}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText(/9:00 PM → 2:00 AM · next day IST/)).toBeVisible();
  });
  it('rejects a duration crossing an occupied interval after midnight', () => {
    const onSelect = vi.fn();
    render(
      <EventTimeTimeline
        date="2030-11-16"
        slots={[{ ...slot, endTime: '2030-11-16T19:30:00.000Z' }]}
        time="21:00"
        endTime="23:00"
        selectedSlotId={slot.id}
        onSelect={onSelect}
      />,
    );
    fireEvent.change(screen.getByLabelText('Event duration'), { target: { value: '300' } });
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('available interval');
  });
  it('supports keyboard range changes and exact end time entry', () => {
    const onSelect = vi.fn();
    render(
      <EventTimeTimeline
        date="2030-11-16"
        slots={[slot]}
        time="21:00"
        endTime="23:00"
        selectedSlotId={slot.id}
        onSelect={onSelect}
      />,
    );
    fireEvent.change(screen.getByLabelText('Adjust event end'), { target: { value: '1560' } });
    expect(onSelect).toHaveBeenLastCalledWith(slot, '21:00', '02:00');
    fireEvent.change(screen.getByLabelText('Event end time'), { target: { value: '01:00' } });
    expect(onSelect).toHaveBeenLastCalledWith(slot, '21:00', '01:00');
  });
});
