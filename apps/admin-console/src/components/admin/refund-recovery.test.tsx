import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError, statusToErrorCode } from '@c1rcle/api-client';

import { RefundRecovery } from './refund-recovery';

import type { RefundOutcome } from '@/lib/admin/admin-api';

const api = vi.hoisted(() => ({ reconcile: vi.fn(), execute: vi.fn() }));
vi.mock('@/lib/admin/admin-api', () => ({
  reconcileRefund: api.reconcile,
  executeRefund: api.execute,
}));
const updated = vi.fn();
const request = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'refund-one',
    status: 'executing',
    providerRefundId: null,
    providerStatus: null,
    ...overrides,
  }) as RefundOutcome['request'];
function fill(id = 'rfnd_candidate', reason = 'Provider dashboard review') {
  fireEvent.change(screen.getByLabelText('Provider refund ID'), { target: { value: id } });
  fireEvent.change(screen.getByLabelText('Recovery reason'), { target: { value: reason } });
}
beforeEach(() => {
  vi.clearAllMocks();
  api.reconcile.mockReset();
  api.execute.mockReset();
});

describe('bounded executing refund recovery', () => {
  it('requires a valid provider refund ID and reason, with no amount/status input or execution shortcut', () => {
    render(<RefundRecovery request={request()} onUpdated={updated} />);
    const reconcile = screen.getByRole('button', { name: 'Reconcile provider refund' });
    expect(reconcile).toBeDisabled();
    fill('pay_not_a_refund');
    expect(reconcile).toBeDisabled();
    fill('rfnd_candidate', '   ');
    expect(reconcile).toBeDisabled();
    fill();
    expect(reconcile).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Resume refund processing' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/amount/i)).not.toBeInTheDocument();
    expect(api.reconcile).not.toHaveBeenCalled();
    expect(api.execute).not.toHaveBeenCalled();
  });

  it('records verified provider evidence first and resumes internal processing only on a separate operator action', async () => {
    api.reconcile.mockResolvedValue({
      request: request({ providerRefundId: 'rfnd_candidate', providerStatus: 'processed' }),
    });
    api.execute.mockResolvedValue({
      request: request({
        status: 'settled',
        providerRefundId: 'rfnd_candidate',
        providerStatus: 'processed',
      }),
    });
    render(<RefundRecovery request={request()} onUpdated={updated} />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Reconcile provider refund' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved provider status: processed');
    expect(api.reconcile).toHaveBeenCalledWith(
      'refund-one',
      { providerRefundId: 'rfnd_candidate', reason: 'Provider dashboard review' },
      expect.any(String),
    );
    expect(api.execute).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Resume refund processing' }));
    expect(
      await screen.findByText('Refund processing returned status: settled.'),
    ).toBeInTheDocument();
    expect(api.execute).toHaveBeenCalledWith('refund-one', expect.any(String));
    expect(updated).toHaveBeenCalledTimes(2);
  });

  it('retains the same reconciliation intent on network retry and creates a different one only for changed evidence', async () => {
    api.reconcile.mockRejectedValue(new Error('network'));
    render(<RefundRecovery request={request()} onUpdated={updated} />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Reconcile provider refund' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Reconcile provider refund' }));
    await waitFor(() => {
      expect(api.reconcile).toHaveBeenCalledTimes(2);
    });
    await screen.findByRole('alert');
    expect(api.reconcile.mock.calls[0]?.[2]).toBe(api.reconcile.mock.calls[1]?.[2]);
    fill('rfnd_different');
    fireEvent.click(screen.getByRole('button', { name: 'Reconcile provider refund' }));
    await waitFor(() => {
      expect(api.reconcile).toHaveBeenCalledTimes(3);
    });
    expect(api.reconcile.mock.calls[2]?.[2]).not.toBe(api.reconcile.mock.calls[1]?.[2]);
    expect(updated).not.toHaveBeenCalled();
    expect(api.execute).not.toHaveBeenCalled();
  });

  it('prevents duplicate submission and evidence changes while a reconciliation is pending', async () => {
    let complete!: (outcome: unknown) => void;
    api.reconcile.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    render(<RefundRecovery request={request()} onUpdated={updated} />);
    fill();
    const button = screen.getByRole('button', { name: 'Reconcile provider refund' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(screen.getByLabelText('Provider refund ID')).toBeDisabled();
    expect(api.reconcile).toHaveBeenCalledTimes(1);
    complete({
      request: request({ providerRefundId: 'rfnd_candidate', providerStatus: 'pending' }),
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'A pending result keeps the refund locked',
    );
  });

  it('uses a fresh observation after a successful pending check instead of replaying stale provider evidence', async () => {
    api.reconcile
      .mockResolvedValueOnce({
        request: request({ providerRefundId: 'rfnd_candidate', providerStatus: 'pending' }),
      })
      .mockResolvedValueOnce({
        request: request({ providerRefundId: 'rfnd_candidate', providerStatus: 'processed' }),
      });
    render(<RefundRecovery request={request()} onUpdated={updated} />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Reconcile provider refund' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved provider status: pending');
    fireEvent.click(screen.getByRole('button', { name: 'Reconcile provider refund' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Saved provider status: processed'),
    );
    expect(api.reconcile.mock.calls[0]?.[2]).not.toBe(api.reconcile.mock.calls[1]?.[2]);
    expect(api.execute).not.toHaveBeenCalled();
  });

  it('keeps an already linked provider identity read-only and preserves the resume key after failure', async () => {
    api.execute.mockRejectedValue(new Error('network'));
    render(
      <RefundRecovery
        request={request({ providerRefundId: 'rfnd_known', providerStatus: 'processed' })}
        onUpdated={updated}
      />,
    );
    expect(screen.getByLabelText('Provider refund ID')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Provider refund ID')).toHaveValue('rfnd_known');
    fireEvent.click(screen.getByRole('button', { name: 'Resume refund processing' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Resume refund processing' }));
    await waitFor(() => {
      expect(api.execute).toHaveBeenCalledTimes(2);
    });
    expect(api.execute.mock.calls[0]?.[1]).toBe(api.execute.mock.calls[1]?.[1]);
    expect(updated).not.toHaveBeenCalled();
  });

  it.each([403, 409])(
    'does not claim settlement or release a lock when the server rejects recovery (%s)',
    async (status) => {
      api.reconcile.mockRejectedValue(
        new ApiClientError({
          status,
          code: statusToErrorCode(status),
          message: 'rejected',
          requestId: undefined,
          fieldErrors: undefined,
        }),
      );
      render(<RefundRecovery request={request()} onUpdated={updated} />);
      fill();
      fireEvent.click(screen.getByRole('button', { name: 'Reconcile provider refund' }));
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(
        status === 403 ? /not authorized/i : /evidence could not be accepted/i,
      );
      expect(updated).not.toHaveBeenCalled();
      expect(api.execute).not.toHaveBeenCalled();
    },
  );

  it.each(['pending', 'approved', 'failed', 'settled', 'rejected'])(
    'does not expose recovery for %s requests',
    (status) => {
      render(<RefundRecovery request={request({ status })} onUpdated={updated} />);
      expect(screen.queryByRole('region', { name: 'Refund recovery' })).not.toBeInTheDocument();
    },
  );
});
