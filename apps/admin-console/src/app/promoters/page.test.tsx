import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PromotersDesk from '@/app/promoters/page';

import type * as AdminApi from '@/lib/admin/admin-api';

vi.mock('@/lib/admin/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApi>();
  return {
    ...actual,
    exportPromotersCsv: vi.fn(),
    listAudit: vi.fn(),
    listPromoterAssignments: vi.fn(),
    listPromoterReferralLinks: vi.fn(),
    listPromoterRiskFlags: vi.fn(),
    suspendPromoter: vi.fn(),
    reinstatePromoter: vi.fn(),
    deactivatePromoterReferralLink: vi.fn(),
  };
});

const api = await import('@/lib/admin/admin-api');

const assignment = {
  id: 'assignment_1',
  eventId: 'event_1',
  promoterId: 'organization_promoter_1',
  status: 'active',
  ratePercent: 10,
  flatPaise: 0,
  termsVersion: 2,
  startsAt: null,
  expiresAt: null,
  eligibleTierIds: ['tier_1'],
  createdAt: '2026-10-28T12:00:00.000Z',
  invitedAt: '2026-10-28T12:00:00.000Z',
  invitedBy: 'organization_host_1',
  acceptedAt: '2026-10-28T12:10:00.000Z',
  respondedBy: 'organization_promoter_1',
  endedAt: null,
  revokedAt: null,
  revokedBy: null,
  revocationReason: null,
  suspendedAt: null,
};

function renderDesk() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PromotersDesk />
    </QueryClientProvider>,
  );
}

describe('PromotersDesk', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.listPromoterAssignments).mockResolvedValue({
      items: [assignment],
      pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false },
    } as never);
    vi.mocked(api.listAudit).mockResolvedValue({
      items: [
        {
          id: 'audit_1',
          adminId: 'admin_1',
          adminRole: 'ops',
          action: 'PROMOTER_SUSPEND',
          targetType: 'promoter',
          targetId: 'organization_promoter_1',
          targetName: null,
          before: { assignments: [{ status: 'active' }] },
          after: { assignments: [{ status: 'suspended' }] },
          reason: 'Manual review pending',
          occurredAt: Date.parse('2026-10-28T12:30:00.000Z'),
        },
      ],
    });
    vi.mocked(api.listPromoterReferralLinks).mockResolvedValue({
      items: [
        {
          id: 'referral_1',
          eventId: 'event_1',
          assignmentId: 'assignment_1',
          eventTitle: 'M4 Test Event',
          code: 'PROMO123',
          label: 'Launch',
          isActive: true,
          clicks: 12,
          lastClickedAt: '2026-10-28T12:10:00.000Z',
          conversions: 3,
          createdAt: '2026-10-28T12:00:00.000Z',
          updatedAt: '2026-10-28T12:10:00.000Z',
        },
      ],
      pageInfo: { page: 1, pageSize: 50, total: 1, hasNextPage: false },
    });
    vi.mocked(api.listPromoterRiskFlags).mockResolvedValue({
      promoterId: 'organization_promoter_1',
      complete: true,
      flags: [
        {
          paymentId: 'payment_1',
          disputeId: 'dispute_1',
          orderId: 'order_1',
          bookingReference: 'C1-M4-0001',
          eventId: 'event_1',
          status: 'under_review',
          amountPaise: 12_500,
          providerOccurredAt: '2026-10-28T12:15:00.000Z',
        },
      ],
    } as never);
    vi.mocked(api.suspendPromoter).mockResolvedValue({} as never);
    vi.mocked(api.deactivatePromoterReferralLink).mockResolvedValue({} as never);
  });

  it('requires a reason and sends it with the audited suspension command', async () => {
    renderDesk();
    await screen.findByText('10%');
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    fireEvent.change(screen.getByLabelText('Reason for suspension'), {
      target: { value: 'Manual review pending' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm suspend' }));

    await waitFor(() => {
      expect(api.suspendPromoter).toHaveBeenCalledWith(
        'organization_promoter_1',
        'Manual review pending',
      );
    });
  });

  it('loads the immutable audit history and snapshots for the selected promoter', async () => {
    renderDesk();
    fireEvent.click(await screen.findByRole('button', { name: /View audit history/ }));

    expect(await screen.findByText('Promoter audit history')).toBeInTheDocument();
    expect(api.listAudit).toHaveBeenCalledWith(50, 'organization_promoter_1');
    expect(api.listPromoterReferralLinks).toHaveBeenCalledWith('organization_promoter_1', 50);
    expect(api.listPromoterRiskFlags).toHaveBeenCalledWith('organization_promoter_1');
    expect(await screen.findByText('Manual review pending')).toBeInTheDocument();
    expect(await screen.findByText('PROMO123')).toBeInTheDocument();
    expect(await screen.findByText('Risk flags')).toBeInTheDocument();
    expect(await screen.findByText(/Booking C1-M4-0001/)).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);

    fireEvent.click(screen.getByText('Before and after snapshots'));
    expect(screen.getByText(/"status": "active"/)).toBeInTheDocument();
    expect(screen.getByText(/"status": "suspended"/)).toBeInTheDocument();
  });

  it('requires a reason before deactivating a referral link', async () => {
    renderDesk();
    fireEvent.click(await screen.findByRole('button', { name: /View audit history/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Deactivate' }));
    fireEvent.change(screen.getByLabelText('Reason for deactivation'), {
      target: { value: 'Confirmed policy violation' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(api.deactivatePromoterReferralLink).toHaveBeenCalledWith(
        'referral_1',
        'Confirmed policy violation',
      );
    });
  });
});
