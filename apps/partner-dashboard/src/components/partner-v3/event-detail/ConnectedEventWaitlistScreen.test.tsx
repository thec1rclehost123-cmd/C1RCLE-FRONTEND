import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectedEventWaitlistScreen } from './ConnectedEventWaitlistScreen';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn<
    (input: {
      path: string;
      body: Record<string, unknown>;
      schema: unknown;
      headers: Record<string, string>;
    }) => Promise<unknown>
  >(),
}));

vi.mock('@/lib/api/client', () => ({ apiClient: mocks }));

const tier = {
  id: 'tier_wait_1',
  eventId: 'event_wait_1',
  organizationId: 'org_wait_1',
  name: 'General admission',
  description: '',
  entryType: 'general',
  currency: 'INR',
  priceInPaise: 25_000,
  quantity: 0,
  status: 'active',
  salesStartAt: null,
  salesEndAt: null,
  maxPerOrder: null,
  version: 1,
  createdAt: '2026-10-28T12:00:00.000Z',
  updatedAt: '2026-10-28T12:00:00.000Z',
} as const;

const waitingEntry = {
  id: 'wait_entry_1',
  eventId: 'event_wait_1',
  organizationId: 'org_wait_1',
  tierId: 'tier_wait_1',
  sequence: 1,
  status: 'waiting',
  offeredAt: null,
  offerExpiresAt: null,
  resolvedAt: null,
};

describe('ConnectedEventWaitlistScreen', () => {
  beforeEach(() => {
    mocks.get.mockReset().mockResolvedValue({
      items: [waitingEntry],
      pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false, nextCursor: null },
    });
    mocks.post.mockReset();
  });

  it('offers the next guest and reuses the same idempotency key after an ambiguous failure', async () => {
    mocks.post.mockRejectedValueOnce(new Error('Network interrupted')).mockResolvedValueOnce({
      entry: { ...waitingEntry, status: 'offered' },
      holdId: 'hold_wait_1',
      expiresAt: '2026-10-28T12:10:00.000Z',
      pricing: { grandTotalPaise: 25_000 },
    });
    render(
      <ConnectedEventWaitlistScreen
        studio="host"
        eventId="event_wait_1"
        eventTitle="Night Event"
        organizationId="org_wait_1"
        tiers={[tier]}
      />,
    );

    expect(await screen.findByText('waiting')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Offer next guest' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Network interrupted');
    fireEvent.click(screen.getByRole('button', { name: 'Offer next guest' }));

    await waitFor(() => {
      expect(mocks.post).toHaveBeenCalledTimes(2);
    });
    const firstKey = mocks.post.mock.calls[0]?.[0].headers['idempotency-key'];
    const retryKey = mocks.post.mock.calls[1]?.[0].headers['idempotency-key'];
    expect(firstKey).toBeTruthy();
    expect(retryKey).toBe(firstKey);
    expect(mocks.post.mock.calls[0]?.[0].headers['x-organization-id']).toBe('org_wait_1');
    expect(mocks.post.mock.calls[1]?.[0].headers['x-organization-id']).toBe('org_wait_1');
    expect(await screen.findByRole('status')).toHaveTextContent('A ₹250.00 offer is reserved');
  });
});
