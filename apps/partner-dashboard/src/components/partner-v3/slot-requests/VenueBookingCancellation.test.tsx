import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VenueBookingCancellation } from './VenueBookingCancellation';

const mocks = vi.hoisted(() => ({ cancel: vi.fn() }));
vi.mock('@/lib/slot-requests/venue-booking-lifecycle', () => ({
  cancelAcceptedVenueBooking: mocks.cancel,
}));
beforeEach(() => {
  mocks.cancel.mockReset();
});
describe('Venue booking cancellation', () => {
  it('requires a reason and refreshes only after the server accepts cancellation', async () => {
    const refresh = vi.fn();
    mocks.cancel.mockResolvedValue({ status: 'cancelled' });
    render(<VenueBookingCancellation requestId="accepted" onCancelled={refresh} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel accepted booking' }));
    expect(screen.getByRole('button', { name: 'Confirm booking cancellation' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Venue cancellation reason'), {
      target: { value: 'Venue unavailable' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking cancellation' }));
    await waitFor(() => {
      expect(mocks.cancel).toHaveBeenCalledWith(
        'accepted',
        'Venue unavailable',
        expect.any(String),
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Booking cancelled');
    expect(refresh).toHaveBeenCalledOnce();
  });
  it('retains the same intent on retry and never shows success on failure', async () => {
    mocks.cancel.mockRejectedValue(new Error('Connection interrupted'));
    render(<VenueBookingCancellation requestId="accepted" />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel accepted booking' }));
    fireEvent.change(screen.getByLabelText('Venue cancellation reason'), {
      target: { value: 'Venue unavailable' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking cancellation' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking cancellation' }));
    await waitFor(() => {
      expect(mocks.cancel).toHaveBeenCalledTimes(2);
    });
    expect(mocks.cancel.mock.calls[0]?.[2]).toBe(mocks.cancel.mock.calls[1]?.[2]);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
