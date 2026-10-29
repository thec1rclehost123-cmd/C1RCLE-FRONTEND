import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrivateTierUnlockClient } from './PrivateTierUnlockClient';

const mocks = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));

vi.mock('@/lib/bff/bff-client', () => ({ bffClient: mocks }));

describe('PrivateTierUnlockClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redeems the entered code and carries the bound grant into checkout', async () => {
    mocks.post.mockResolvedValue({
      id: 'grant_123',
      eventId: 'evt_1',
      scope: 'tiers',
      tierIds: ['tier_private'],
      expiresAt: '2026-10-29T00:00:00.000Z',
    });
    mocks.get.mockResolvedValue({
      items: [
        {
          id: 'tier_private',
          eventId: 'evt_1',
          name: 'Guestlist',
          description: 'Private entry',
          priceInPaise: 150_000,
          currency: 'INR',
          availableQuantity: 12,
        },
      ],
    });

    render(<PrivateTierUnlockClient eventId="sky-night" accentTone="purple" />);
    fireEvent.change(screen.getByLabelText('Have an event or private ticket code?'), {
      target: { value: 'test-access-code-1234567890' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));

    await screen.findByText('Unlocked ticket options');
    fireEvent.click(screen.getByRole('button', { name: /Guestlist/ }));
    expect(await screen.findByRole('link', { name: /Continue/ })).toHaveAttribute(
      'href',
      '/checkout/sky-night?tier=tier_private#accessGrantId=grant_123',
    );
    expect(mocks.post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/ticket-access-codes/redeem',
        body: { code: 'test-access-code-1234567890' },
      }),
    );
    expect(mocks.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/public/events/sky-night/tiers',
        headers: { 'x-ticket-access-grant-id': 'grant_123' },
      }),
    );
  });

  it('loads protected event detail and keeps the event grant through checkout', async () => {
    mocks.post.mockResolvedValue({
      id: 'event_grant',
      eventId: 'evt_1',
      scope: 'event',
      tierIds: [],
      expiresAt: '2026-10-29T00:00:00.000Z',
    });
    mocks.get
      .mockResolvedValueOnce({
        id: 'evt_1',
        organizationId: 'org_1',
        venueId: null,
        slug: 'sky-night',
        title: 'Sky Night Private',
        summary: 'Invitation event',
        description: 'Private detail.',
        imageUrl: null,
        startAt: '2026-11-28T20:00:00.000Z',
        endAt: null,
        status: 'published',
        visibilityMode: 'code',
        isPublic: false,
        tags: [],
        startingPricePaise: 150_000,
        isFree: false,
        cancellationReason: null,
        version: 1,
        createdAt: '2026-10-28T12:00:00.000Z',
        updatedAt: '2026-10-28T12:00:00.000Z',
        venue: null,
        organizer: null,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'tier_public',
            eventId: 'evt_1',
            name: 'General',
            description: 'Entry',
            priceInPaise: 150_000,
            currency: 'INR',
            availableQuantity: 12,
          },
        ],
      });

    render(<PrivateTierUnlockClient eventId="sky-night" accentTone="purple" />);
    fireEvent.change(screen.getByLabelText('Have an event or private ticket code?'), {
      target: { value: 'test-event-code-1234567890' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));

    expect(await screen.findByRole('heading', { name: 'Sky Night Private' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /General/ }));
    expect(await screen.findByRole('link', { name: /Continue/ })).toHaveAttribute(
      'href',
      '/checkout/sky-night?tier=tier_public#accessGrantId=event_grant',
    );
    expect(mocks.get).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        path: '/api/public/events/sky-night',
        headers: { 'x-ticket-access-grant-id': 'event_grant' },
      }),
    );
  });
});
