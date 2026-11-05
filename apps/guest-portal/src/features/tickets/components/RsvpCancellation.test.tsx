import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RsvpCancellation } from './RsvpCancellation';

const { post } = vi.hoisted(() => ({ post: vi.fn<(...args: unknown[]) => Promise<unknown>>() }));
vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: { post: (...args: unknown[]) => post(...args) },
}));
beforeEach(() => {
  post.mockReset();
});
describe('RSVP self-cancellation', () => {
  it('requires confirmation and reports release only after the server accepts', async () => {
    const cancelled = vi.fn();
    post.mockResolvedValue({ order: { status: 'cancelled' } });
    render(<RsvpCancellation orderId="RSVP-1" onCancelled={cancelled} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel RSVP' }));
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Your place has been released');
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/rsvp/RSVP-1/cancel', body: {} }),
    );
    expect(cancelled).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Confirm cancellation' })).not.toBeInTheDocument();
  });
  it('preserves the RSVP and allows retry after a server failure', async () => {
    const cancelled = vi.fn();
    post.mockRejectedValue(new Error('Offline'));
    render(<RsvpCancellation orderId="RSVP-1" onCancelled={cancelled} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel RSVP' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not cancel');
    expect(cancelled).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    post.mockResolvedValue({ order: { status: 'cancelled' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
    await waitFor(() => {
      expect(cancelled).toHaveBeenCalledOnce();
    });
  });
});
