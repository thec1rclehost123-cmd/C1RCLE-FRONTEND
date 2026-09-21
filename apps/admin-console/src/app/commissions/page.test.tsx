import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import CommissionsDesk from '@/app/commissions/page';

import type * as AdminApi from '@/lib/admin/admin-api';

vi.mock('@/lib/admin/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApi>();
  return {
    ...actual,
    listHosts: vi.fn(),
    raiseCommissionAdjustProposal: vi.fn(),
  };
});

const adminApi = await import('@/lib/admin/admin-api');

const host = {
  id: 'org_1',
  ownerId: 'user_1',
  name: 'Test Venue Co',
  slug: 'test-venue-co',
  status: 'active' as const,
  platformFeePercent: 10,
  memberCount: 3,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

function renderDesk() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CommissionsDesk />
    </QueryClientProvider>,
  );
}

describe('Commissions desk', () => {
  beforeEach(() => {
    vi.mocked(adminApi.listHosts).mockResolvedValue({
      items: [host],
      pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false },
    });
  });

  it('renders organizations with their live platform fee', async () => {
    renderDesk();

    expect(await screen.findByText('Test Venue Co')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('raises a COMMISSION_ADJUST proposal via raiseCommissionAdjustProposal', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.raiseCommissionAdjustProposal).mockResolvedValue({} as never);

    renderDesk();

    await user.click(await screen.findByRole('button', { name: 'Adjust' }));

    const rateInput = screen.getByLabelText('New platform fee (%)');
    await user.clear(rateInput);
    await user.type(rateInput, '25');

    const reasonInput = screen.getByPlaceholderText(/Business justification/);
    await user.type(reasonInput, 'Renegotiated rate with venue');

    await user.click(screen.getByRole('button', { name: 'Raise COMMISSION_ADJUST proposal' }));

    await waitFor(() => {
      expect(adminApi.raiseCommissionAdjustProposal).toHaveBeenCalledWith({
        organizationId: 'org_1',
        newRatePercent: 25,
        reason: 'Renegotiated rate with venue',
      });
    });

    expect(await screen.findByText(/Proposal raised for/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Proposals/ })).toHaveAttribute(
      'href',
      '/proposals',
    );
  });
});
