import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@c1rcle/auth';

import EventCoverConfirmPage from './page';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/bff/bff-client', () => ({ bffClient: mocks }));
vi.mock('@/lib/bff/csrf', () => ({ csrfHeaders: () => ({ 'x-csrf-token': 'fixture' }) }));
vi.mock('next/navigation', () => ({ useParams: () => ({ challengeId: 'challenge_1' }) }));

const challenge = {
  id: 'challenge_1',
  entitlementId: 'entitlement_1',
  eventId: 'event_1',
  amountPaise: 4_000,
  grossSpendPaise: 6_000,
  categories: ['food'],
  status: 'pending' as const,
  expiresAt: '2026-11-01T20:02:00.000Z',
};

describe('EventCoverConfirmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({ accessToken: null, status: 'anonymous' });
  });

  it('requires sign-in and does not read or confirm a Guest challenge while logged out', () => {
    render(<EventCoverConfirmPage />);

    expect(screen.getByRole('link', { name: 'Sign in to review' })).toHaveAttribute(
      'href',
      '/login?next=%2Fevent-cover-confirm%2Fchallenge_1',
    );
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('shows the exact charge and requires explicit Guest confirmation', async () => {
    useSessionStore.setState({ accessToken: 'fixture-access-token', status: 'authenticated' });
    mocks.get.mockResolvedValue(challenge);
    mocks.post.mockResolvedValue({ ...challenge, status: 'confirmed' });
    render(<EventCoverConfirmPage />);

    expect(await screen.findByText('₹40.00')).toBeInTheDocument();
    expect(screen.getByText('₹60.00')).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: 'Confirm this cover use' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mocks.post).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/wallet/event-cover-redemption-challenges/challenge_1',
          body: {},
          headers: { 'x-csrf-token': 'fixture' },
        }),
      );
    });
    expect(await screen.findByText(/The Venue can complete this purchase now/)).toBeInTheDocument();
  });
});
