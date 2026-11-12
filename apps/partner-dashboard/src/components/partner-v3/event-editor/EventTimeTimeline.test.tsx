import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
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
  it('selects an overnight end using the end time and labels the next day', () => {
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
    fireEvent.change(screen.getByLabelText('Event end time'), { target: { value: '02:00' } });
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
  it('keeps a blocked edit visible while the selected range remains outside availability', () => {
    const onSelect = vi.fn();
    const shortenedSlot = { ...slot, endTime: '2030-11-16T19:30:00.000Z' };
    render(
      <EventTimeTimeline
        date="2030-11-16"
        slots={[shortenedSlot]}
        time="21:00"
        endTime="23:00"
        selectedSlotId={slot.id}
        onSelect={onSelect}
      />,
    );
    fireEvent.change(screen.getByLabelText('Event end time'), { target: { value: '02:00' } });
    expect(onSelect).toHaveBeenCalledWith(shortenedSlot, '21:00', '02:00');
    expect(screen.getByRole('alert')).toHaveTextContent('available interval');
  });
  it('allows the time fields to recover a range that overlapped a booked interval', () => {
    const beforeBooking: AvailabilitySlot = {
      id: 'free-before-booking',
      label: 'Before booking',
      status: 'available',
      startTime: '2030-11-15T18:30:00.000Z',
      endTime: '2030-11-16T14:30:00.000Z',
      timezone: 'Asia/Kolkata',
    };
    const afterBooking: AvailabilitySlot = {
      ...beforeBooking,
      id: 'free-after-booking',
      label: 'After booking',
      startTime: '2030-11-16T17:30:00.000Z',
      endTime: '2030-11-17T18:30:00.000Z',
    };
    const Harness = () => {
      const [time, setTime] = useState('18:00');
      const [endTime, setEndTime] = useState('22:00');
      const [selectedSlotId, setSelectedSlotId] = useState(beforeBooking.id);
      return (
        <EventTimeTimeline
          date="2030-11-16"
          slots={[beforeBooking, afterBooking]}
          time={time}
          endTime={endTime}
          selectedSlotId={selectedSlotId}
          onSelect={(selected, start, end) => {
            setSelectedSlotId(selected.id);
            setTime(start);
            setEndTime(end);
          }}
        />
      );
    };
    render(<Harness />);

    fireEvent.change(screen.getByLabelText('Event end time'), { target: { value: '21:30' } });
    expect(screen.getByRole('alert')).toHaveTextContent('available interval');
    fireEvent.change(screen.getByLabelText('Event end time'), { target: { value: '19:00' } });

    expect(screen.getByLabelText('Event start time')).toHaveValue('18:00');
    expect(screen.getByLabelText('Event end time')).toHaveValue('19:00');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('keeps exact time inputs without redundant sliders or duration', () => {
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
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Event duration')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Event start time'), { target: { value: '20:00' } });
    expect(onSelect).toHaveBeenLastCalledWith(slot, '20:00', '22:00');
    fireEvent.change(screen.getByLabelText('Event end time'), { target: { value: '01:00' } });
    expect(onSelect).toHaveBeenLastCalledWith(slot, '21:00', '01:00');
  });
});
