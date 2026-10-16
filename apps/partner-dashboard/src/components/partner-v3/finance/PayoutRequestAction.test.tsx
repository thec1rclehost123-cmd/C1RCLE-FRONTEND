import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PayoutRequestAction } from './PayoutRequestAction';

const { refresh, requestPayout } = vi.hoisted(() => ({
  refresh: vi.fn(),
  requestPayout: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@c1rcle/icons', () => ({
  RequestPayoutIcon: () => <svg aria-hidden="true" />,
}));

vi.mock('@/lib/api/client', () => ({ apiClient: { kind: 'test-client' } }));
vi.mock('@/lib/finance/api-finance-repository', () => ({ requestPayout }));

const request = {
  organizationId: 'org_1',
  availablePaise: 50_000,
  bankAccountId: 'bank_1',
};

describe('PayoutRequestAction', () => {
  beforeEach(() => {
    refresh.mockReset();
    requestPayout.mockReset();
  });

  it('submits integer paise and refreshes the API-backed finance screen', async () => {
    const user = userEvent.setup();
    requestPayout.mockResolvedValue({ id: 'payout_1' });
    render(<PayoutRequestAction request={request} />);

    await user.click(screen.getByRole('button', { name: 'Request payout' }));
    await user.type(screen.getByRole('textbox', { name: 'Amount (₹)' }), '250.50');
    await user.click(screen.getByRole('button', { name: 'Confirm payout' }));

    await waitFor(() => {
      expect(requestPayout).toHaveBeenCalledTimes(1);
    });
    expect(requestPayout).toHaveBeenCalledWith(
      expect.anything(),
      'org_1',
      { amountPaise: 25_050, bankAccountId: 'bank_1' },
      expect.any(String),
    );
    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });

  it('reuses the same intent key when a response fails and the user retries', async () => {
    const user = userEvent.setup();
    requestPayout.mockRejectedValueOnce(new Error('network unavailable')).mockResolvedValueOnce({
      id: 'payout_1',
    });
    render(<PayoutRequestAction request={request} />);

    await user.click(screen.getByRole('button', { name: 'Request payout' }));
    await user.type(screen.getByRole('textbox', { name: 'Amount (₹)' }), '200');
    await user.click(screen.getByRole('button', { name: 'Confirm payout' }));
    expect(await screen.findByText('network unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm payout' }));

    await waitFor(() => {
      expect(requestPayout).toHaveBeenCalledTimes(2);
    });
    expect(requestPayout.mock.calls[1]?.[3]).toBe(requestPayout.mock.calls[0]?.[3]);
  });

  it('stays unavailable without an API-backed organization and bank account', () => {
    render(<PayoutRequestAction request={null} />);
    expect(screen.getByRole('button', { name: 'Request payout' })).toBeDisabled();
  });
});
