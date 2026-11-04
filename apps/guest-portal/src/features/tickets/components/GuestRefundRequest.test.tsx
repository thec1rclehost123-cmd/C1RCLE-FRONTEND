import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GuestRefundRequest } from './GuestRefundRequest';

const post = vi.hoisted(() => vi.fn());
vi.mock('@/lib/bff/bff-client', () => ({ bffClient: { post } }));
beforeEach(() => {
  post.mockReset();
});
describe('Guest refund review', () => {
  it('requests review for the exact ticket and shows server-confirmed success', async () => {
    post.mockResolvedValue({
      id: 'review-one',
      status: 'open',
      requestedAt: '2026-11-04T00:00:00.000Z',
    });
    render(<GuestRefundRequest ticketId="riya" allowed />);
    fireEvent.change(screen.getByLabelText('Why are you requesting a refund?'), {
      target: { value: 'Riya cannot attend' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send refund request' }));
    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/tickets/riya/refund-review',
          body: { reason: 'Riya cannot attend' },
        }),
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent('with our team');
    expect(screen.queryByRole('button', { name: 'Send refund request' })).not.toBeInTheDocument();
  });
  it('keeps the form available after a failed request and never claims success', async () => {
    post.mockRejectedValue(new Error('network'));
    render(<GuestRefundRequest ticketId="riya" allowed />);
    fireEvent.change(screen.getByLabelText('Why are you requesting a refund?'), {
      target: { value: 'reason' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send refund request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be sent');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('uses a persisted review after reloading rather than allowing a duplicate request', () => {
    render(
      <GuestRefundRequest
        ticketId="riya"
        allowed={false}
        initialReview={{
          id: 'review-one',
          status: 'in_progress',
          requestedAt: '2026-11-04T00:00:00.000Z',
        }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('with our team');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
