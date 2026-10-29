import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PromoterLinksConnected } from './PromoterLinksConnected';

const { deactivate, refresh } = vi.hoisted(() => ({
  deactivate: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('@/lib/partner/promoter-assignment-repository', () => ({
  deactivatePromoterReferralLink: deactivate,
}));

const link = {
  id: 'link_1',
  eventId: 'event_1',
  promoterId: 'promoter_1',
  organizationId: 'host_1',
  assignmentId: 'assignment_1',
  assignmentVersion: 1,
  termsSnapshot: null,
  commissionPolicyVersion: null,
  commercialPolicyVersion: null,
  eligibleTierIds: null,
  attributionSignature: null,
  eventTitle: 'Night One',
  campaignLabel: 'Night One',
  vanityPrefix: 'r',
  vanitySlug: 'night-one',
  code: 'NIGHT1',
  label: 'Campaign link',
  isActive: true,
  clicks: 7,
  lastClickedAt: null,
  conversions: 2,
  revenuePaise: 10000,
  commissionPaise: 1500,
  version: 1,
  createdAt: '2026-10-28T12:00:00.000Z',
  updatedAt: '2026-10-28T12:00:00.000Z',
} as const;

describe('PromoterLinksConnected', () => {
  beforeEach(() => {
    deactivate.mockReset().mockResolvedValue(link);
    refresh.mockReset();
  });

  it('shows backend link activity and deactivates without hiding the historical link', async () => {
    render(
      <PromoterLinksConnected items={[link]} page={1} pageSize={100} total={1} nextCursor={null} />,
    );

    expect(screen.getByText('Night One')).toBeTruthy();
    expect(screen.getByText(/7 clicks · 2 conversions/)).toBeTruthy();
    expect(screen.getByDisplayValue(/r\/night-one$/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate link' }));

    await waitFor(() => {
      expect(deactivate).toHaveBeenCalledWith({ referralLinkId: 'link_1' });
    });
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.getByText(/Past order attribution is preserved/)).toBeTruthy();
  });

  it('does not offer deactivation for an inactive link and supports a next page', () => {
    render(
      <PromoterLinksConnected
        items={[{ ...link, isActive: false }]}
        page={1}
        pageSize={100}
        total={101}
        nextCursor="100"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Deactivate link' })).toBeNull();
    expect(screen.getByText('Showing 1–1 of 101 referral links.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Next page' }).getAttribute('href')).toBe(
      '/partner/promoter/links?cursor=100',
    );
  });

  it('offers a previous page from later cursor pages', () => {
    render(
      <PromoterLinksConnected
        items={[link]}
        page={3}
        pageSize={100}
        total={201}
        nextCursor={null}
      />,
    );

    expect(screen.getByRole('link', { name: 'Previous page' }).getAttribute('href')).toBe(
      '/partner/promoter/links?cursor=100',
    );
  });
});
