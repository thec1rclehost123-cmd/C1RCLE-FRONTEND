import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectedEventAccessScreen } from './ConnectedEventAccessScreen';

import type { TicketAccessCodeDto, TicketTierDto } from '@c1rcle/contracts';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiClient: mocks }));

const tier = {
  id: 'tier_private',
  eventId: 'evt_1',
  organizationId: 'org_1',
  name: 'Guestlist',
  description: '',
  entryType: 'ENTRY',
  currency: 'INR',
  priceInPaise: 150_000,
  quantity: 50,
  status: 'active',
  salesStartAt: null,
  salesEndAt: null,
  maxPerOrder: 10,
  accessMode: 'code',
  accessType: 'ENTRY',
  audienceType: 'GENERAL',
  guestCount: 1,
  admissionMode: 'bundle',
  pricingPhases: [],
  doorPriceInPaise: null,
  benefits: [],
  minAge: null,
  maxAge: null,
  minPerOrder: null,
  maxPerUser: null,
  tableConfig: null,
  commissionEligible: false,
  version: 1,
  createdAt: '2026-10-28T12:00:00.000Z',
  updatedAt: '2026-10-28T12:00:00.000Z',
} as unknown as TicketTierDto;

const code = {
  id: 'a'.repeat(64),
  kind: 'code',
  scope: 'tiers',
  eventId: 'evt_1',
  tierIds: ['tier_private'],
  status: 'active',
  startsAt: '2026-10-28T12:00:00.000Z',
  expiresAt: '2026-10-29T12:00:00.000Z',
  maxRedemptions: 5,
  redemptionCount: 0,
  revokedAt: null,
  revokedReason: null,
  version: 1,
  createdAt: '2026-10-28T12:00:00.000Z',
  updatedAt: '2026-10-28T12:00:00.000Z',
} as TicketAccessCodeDto;

describe('ConnectedEventAccessScreen', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reveals a newly created code once and updates the list after revocation', async () => {
    const revoked = {
      ...code,
      status: 'revoked' as const,
      revokedReason: 'Partner stopped this allocation',
    };
    mocks.post
      .mockResolvedValueOnce({ code: 'one-time-secret-code', accessCode: code })
      .mockResolvedValueOnce(revoked);
    render(
      <ConnectedEventAccessScreen
        studio="venue"
        eventId="evt_1"
        eventTitle="Sky Night"
        organizationId="org_1"
        tiers={[tier]}
        initialCodes={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create code' }));
    expect(await screen.findByText('one-time-secret-code')).toBeInTheDocument();
    expect(mocks.post.mock.calls[0]?.[0]).toMatchObject({
      path: '/api/v2/events/evt_1/access-codes',
      body: { tierIds: ['tier_private'], maxRedemptions: 1 },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    fireEvent.change(screen.getByLabelText('Reason for revocation'), {
      target: { value: 'Partner stopped this allocation' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm revocation' }));
    await waitFor(() => expect(screen.getByText('Revoked')).toBeInTheDocument());
    expect(mocks.post.mock.calls[1]?.[0]).toMatchObject({
      path: `/api/v2/events/evt_1/access-codes/${code.id}/revoke`,
      body: { reason: 'Partner stopped this allocation' },
    });
  });

  it('creates a single-recipient invitation through the separate invitation endpoint', async () => {
    mocks.post.mockResolvedValueOnce({
      code: 'single-recipient-secret',
      accessCode: { ...code, kind: 'invitation', maxRedemptions: 1 },
    });
    render(
      <ConnectedEventAccessScreen
        studio="venue"
        eventId="evt_1"
        eventTitle="Sky Night"
        organizationId="org_1"
        tiers={[{ ...tier, accessMode: 'invited' }]}
        initialCodes={[]}
      />,
    );
    fireEvent.change(screen.getByLabelText('Access type'), { target: { value: 'invitation' } });
    fireEvent.change(screen.getByLabelText('Invitee email'), {
      target: { value: 'named-invite@yopmail.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create invitation' }));
    expect(await screen.findByText('single-recipient-secret')).toBeInTheDocument();
    expect(mocks.post.mock.calls[0]?.[0]).toMatchObject({
      path: '/api/v2/events/evt_1/access-invitations',
      body: {
        tierIds: ['tier_private'],
        recipientEmail: 'named-invite@yopmail.com',
      },
    });
  });

  it('creates an event-scoped code without implicitly selecting hidden tiers', async () => {
    mocks.post.mockResolvedValueOnce({
      code: 'one-time-event-secret',
      accessCode: {
        ...code,
        scope: 'event',
        tierIds: [],
        maxRedemptions: 10,
      },
    });
    render(
      <ConnectedEventAccessScreen
        studio="host"
        eventId="evt_private"
        eventTitle="Private Night"
        eventVisibilityMode="code"
        organizationId="org_1"
        tiers={[]}
        initialCodes={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create code' }));
    expect(await screen.findByText('one-time-event-secret')).toBeInTheDocument();
    expect(mocks.post.mock.calls[0]?.[0]).toMatchObject({
      path: '/api/v2/events/evt_private/access-codes',
      body: { scope: 'event', tierIds: [], maxRedemptions: 1 },
    });
  });
});
