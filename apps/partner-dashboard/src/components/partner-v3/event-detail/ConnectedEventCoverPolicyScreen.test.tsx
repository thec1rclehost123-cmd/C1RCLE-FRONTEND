import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectedEventCoverPolicyScreen } from './ConnectedEventCoverPolicyScreen';

import type { EventCoverPolicyHistoryDto } from '@c1rcle/contracts';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiClient: mocks }));

describe('ConnectedEventCoverPolicyScreen', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a real empty state and keeps approval and sales gated', () => {
    render(
      <ConnectedEventCoverPolicyScreen
        studio="host"
        eventId="evt_1"
        eventTitle="Sky Night"
        organizationId="org_1"
        eventOrganizationId="org_1"
        initialHistory={{ acceptanceEnabled: false, items: [] }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Event cover policy' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cover activation is blocked. Venue acceptance remains disabled until reviewed policy approval is recorded.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No cover policy proposals have been recorded for this event.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Host proposal' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('does not expose Host proposal controls to the Venue organization', () => {
    render(
      <ConnectedEventCoverPolicyScreen
        studio="venue"
        eventId="evt_1"
        eventTitle="Sky Night"
        organizationId="venue_org_1"
        eventOrganizationId="host_org_1"
        initialHistory={{ acceptanceEnabled: false, items: [] }}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Save Host proposal' })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'The Host organization can submit a proposal. Review its exact terms below; acceptance is available only when the reviewed policy approval gate is enabled.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Venue redemption' })).toHaveAttribute(
      'href',
      '/partner/venue/events/evt_1/cover/redeem',
    );
  });

  it('lets the Venue review exact terms and accept only when the server gate is enabled', async () => {
    const proposal: EventCoverPolicyHistoryDto['items'][number]['proposal'] = {
      id: 'proposal_1',
      hostOrganizationId: 'host_org_1',
      venueOrganizationId: 'venue_org_1',
      proposedByUserId: 'host_user_1',
      policyVersion: 'cover-v2',
      terms: {
        eventId: 'evt_1',
        venueOrganizationId: 'venue_org_1',
        merchantOrganizationId: 'venue_org_1',
        coverAmountPaise: 150_000,
        minimumSpendPaise: 50_000,
        redemptionOpensAt: '2026-11-01T18:00:00.000Z',
        redemptionClosesAt: '2026-11-02T02:00:00.000Z',
        eligibleCategories: ['food'],
        excludedCategories: ['alcohol'],
        alcoholRule: 'exclude_alcohol',
        partialRedemption: true,
        splitTender: true,
        refundPolicy: 'unused_full_before_redemption',
        transferUnusedOnly: true,
        commissionBasis: 'net_admission_after_allocated_discount',
        unusedBalancePolicy: 'approved_minimum_spend_expiry',
      },
      termsDigest: 'a'.repeat(64),
      version: 1,
      createdAt: '2026-10-28T12:00:00.000Z',
      updatedAt: '2026-10-28T12:00:00.000Z',
    };
    const acceptance: NonNullable<EventCoverPolicyHistoryDto['items'][number]['acceptance']> = {
      id: 'acceptance_1',
      proposalId: proposal.id,
      eventId: 'evt_1',
      hostOrganizationId: 'host_org_1',
      venueOrganizationId: 'venue_org_1',
      acceptedByUserId: 'venue_user_1',
      proposalVersion: proposal.policyVersion,
      termsDigest: proposal.termsDigest,
      version: 1,
      createdAt: '2026-10-28T13:00:00.000Z',
      updatedAt: '2026-10-28T13:00:00.000Z',
    };
    mocks.post.mockResolvedValue(acceptance);
    mocks.get.mockResolvedValue({
      acceptanceEnabled: true,
      items: [{ proposal, acceptance }],
    });

    render(
      <ConnectedEventCoverPolicyScreen
        studio="venue"
        eventId="evt_1"
        eventTitle="Sky Night"
        organizationId="venue_org_1"
        eventOrganizationId="host_org_1"
        initialHistory={{ acceptanceEnabled: true, items: [{ proposal, acceptance: null }] }}
      />,
    );

    expect(screen.getByText('Review exact terms')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Review exact terms'));
    expect(await screen.findByText(/exclude_alcohol/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accept exact policy version' }));
    expect(await screen.findByText(/Venue acceptance recorded/)).toBeInTheDocument();
    expect(mocks.post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/events/evt_1/cover-policy/proposal_1/accept',
        body: {},
      }),
    );
  });
});
