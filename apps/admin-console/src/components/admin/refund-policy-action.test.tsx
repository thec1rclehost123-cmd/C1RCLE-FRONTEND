import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError, statusToErrorCode } from '@c1rcle/api-client';

import { RefundPolicyAction } from './refund-policy-action';

import type { RefundOutcome } from '@/lib/admin/admin-api';

const api = vi.hoisted(() => ({ execute: vi.fn(), reject: vi.fn(), review: vi.fn() }));
vi.mock('@/lib/admin/admin-api', () => ({
  executeRefund: api.execute,
  rejectRefund: api.reject,
  requestOriginalFeeReview: api.review,
}));
const request = (extra: Record<string, unknown> = {}) =>
  ({ id: 'refund-one', status: 'approved', ...extra }) as RefundOutcome['request'];
const updated = vi.fn();
const conflict = (message: string, status = 409) =>
  new ApiClientError({
    status,
    code: statusToErrorCode(status),
    message,
    requestId: undefined,
    fieldErrors: undefined,
  });
beforeEach(() => {
  vi.resetAllMocks();
});
describe('server-gated refund policy recovery', () => {
  it('does not offer rejection of an approved request until the server demonstrates the policy conflict', async () => {
    api.execute.mockRejectedValue(
      conflict('Event refund policy changed; reject and recreate this request'),
    );
    api.reject.mockResolvedValue({ request: request({ status: 'rejected' }) });
    render(<RefundPolicyAction request={request()} onUpdated={updated} />);
    expect(
      screen.queryByRole('button', { name: 'Reject outdated request' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Execute refund' }));
    const reject = await screen.findByRole('button', { name: 'Reject outdated request' });
    expect(reject).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Policy rejection reason'), {
      target: { value: 'Use full original purchase policy after event change' },
    });
    fireEvent.click(reject);
    await waitFor(() => {
      expect(api.reject).toHaveBeenCalledWith(
        'refund-one',
        'Use full original purchase policy after event change',
        expect.any(String),
      );
    });
    expect(api.review).not.toHaveBeenCalled();
    expect(await screen.findByText(/outdated request was rejected/)).toBeInTheDocument();
  });
  it.each([conflict('Different conflict'), conflict('Event refund policy changed', 403)])(
    'does not open a rejection bypass for unrelated failures',
    async (error) => {
      api.execute.mockRejectedValue(error);
      render(<RefundPolicyAction request={request()} onUpdated={updated} />);
      fireEvent.click(screen.getByRole('button', { name: 'Execute refund' }));
      await screen.findByRole('status');
      expect(
        screen.queryByRole('button', { name: 'Reject outdated request' }),
      ).not.toBeInTheDocument();
      expect(api.reject).not.toHaveBeenCalled();
    },
  );
  it('requests a fee-only review with a stable retry key and leaves approvals authoritative', async () => {
    api.review
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ request: request({ status: 'pending' }) });
    render(
      <RefundPolicyAction
        request={request({ status: 'settled', refundCause: 'guest_request' })}
        onUpdated={updated}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Request original-fee review' }));
    await screen.findByText(/could not be confirmed/);
    const key: unknown = api.review.mock.calls[0]?.[1];
    fireEvent.click(screen.getByRole('button', { name: 'Request original-fee review' }));
    expect(await screen.findByText(/Original-fee review status: pending/)).toBeInTheDocument();
    expect(api.review.mock.calls[1]?.[1]).toBe(key);
    expect(api.execute).not.toHaveBeenCalled();
    expect(api.reject).not.toHaveBeenCalled();
  });
  it.each([
    { status: 'executing', refundCause: 'guest_request' },
    { status: 'settled', refundCause: 'organizer_cancel' },
    { status: 'settled', refundCause: 'guest_request', remedyForRefundRequestId: 'original' },
  ])('does not expose repeated supplements or unrelated status/cause: %j', (extra) => {
    render(<RefundPolicyAction request={request(extra)} onUpdated={updated} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
