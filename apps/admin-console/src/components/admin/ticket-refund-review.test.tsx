import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminTicketRefundReview } from './ticket-refund-review';

const request = vi.hoisted(() => vi.fn());
vi.mock('@/lib/admin/admin-api', () => ({ requestRefund: request }));
beforeEach(() => {
  request.mockReset();
});
describe('Admin attendee refund review handoff', () => {
  it('creates an exact-ticket financial request without executing it', async () => {
    request.mockResolvedValue({});
    render(
      <AdminTicketRefundReview
        orderId="order-one"
        ticketIds={['riya']}
        reason="Riya cannot attend"
      />,
    );
    fireEvent.change(screen.getByLabelText('Refund amount (₹)'), { target: { value: '250.50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create financial refund request' }));
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        {
          orderId: 'order-one',
          targetEntitlementIds: ['riya'],
          amountPaise: 25050,
          reason: 'Riya cannot attend',
        },
        expect.any(String),
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Approval and execution remain separate',
    );
  });
  it('retains the same intent key after an uncertain network failure', async () => {
    request.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({});
    render(<AdminTicketRefundReview orderId="order-one" ticketIds={['riya']} reason="reason" />);
    fireEvent.change(screen.getByLabelText('Refund amount (₹)'), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create financial refund request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be created');
    fireEvent.click(screen.getByRole('button', { name: 'Create financial refund request' }));
    await screen.findByRole('status');
    expect(request.mock.calls[0]?.[1]).toBe(request.mock.calls[1]?.[1]);
  });
});
