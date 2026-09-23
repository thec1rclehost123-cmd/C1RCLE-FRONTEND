import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@c1rcle/auth';

import TicketsPage from './page';

const mockBffGet = vi.fn<(...args: readonly unknown[]) => Promise<unknown>>();
const mockApiGet = vi.fn<(...args: readonly unknown[]) => Promise<unknown>>();

vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: { get: (...args: unknown[]) => mockBffGet(...args) },
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: (...args: unknown[]) => mockApiGet(...args) },
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    preload: _preload,
    fill: _fill,
    ...props
  }: React.ComponentProps<'img'> & { preload?: boolean; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const ENTITLEMENT = {
  id: 'ENT-rsvp-1',
  orderId: 'RSVP-user1',
  eventId: 'evt_rsvp_1',
  organizationId: 'org_1',
  tierId: 'tier_rsvp_1',
  tierName: 'General Admission',
  userId: 'user_1',
  holderName: 'RSVP Guest',
  status: 'valid',
  scanCountAllowed: 1,
  scanCount: 0,
  scannedAt: [],
  version: 1,
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

const REAL_EVENT = {
  id: 'evt_rsvp_1',
  organizationId: 'org_1',
  venueId: 'ven_1',
  slug: 'rsvp-night',
  title: 'RSVP Night',
  summary: '',
  description: '',
  imageUrl: null,
  startAt: '2026-12-25T18:00:00.000Z',
  endAt: null,
  status: 'published',
  isPublic: true,
  tags: [],
  startingPricePaise: 0,
  isFree: true,
  cancellationReason: null,
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const REAL_VENUE = {
  id: 'ven_1',
  organizationId: 'org_1',
  name: 'Sky Bar',
  slug: 'sky-bar',
  status: 'active',
  description: '',
  capacity: null,
  city: 'Mumbai',
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

function mockWalletFeed(entitlements: unknown[] = [ENTITLEMENT]) {
  mockBffGet.mockResolvedValue({
    items: entitlements,
    pageInfo: { page: 1, pageSize: 50, total: entitlements.length, hasNextPage: false },
  });
  mockApiGet.mockImplementation((arg: unknown) => {
    const { path } = arg as { path: string };
    if (path === '/api/v2/public/events/evt_rsvp_1') return Promise.resolve(REAL_EVENT);
    if (path === '/api/v2/public/venues/by-id/ven_1') return Promise.resolve(REAL_VENUE);
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

function authenticate() {
  useSessionStore.setState({ accessToken: 'test-access-token', status: 'authenticated' });
}

describe('TicketsPage real wallet', () => {
  beforeEach(() => {
    useSessionStore.setState({ accessToken: null, session: null, status: 'anonymous' });
    mockBffGet.mockReset();
    mockApiGet.mockReset();
  });

  it('renders the logged-out guest ticket showcase without wallet passes', () => {
    render(<TicketsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'TICKETS' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'YOUR PASS TO THE CIRCLE' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select VIP ticket tier' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LOGIN TO ACCESS' })).toHaveAttribute('href', '/login');
    expect(mockBffGet).not.toHaveBeenCalled();
  });

  it('renders real wallet passes for an authenticated session', async () => {
    authenticate();
    mockWalletFeed();
    render(<TicketsPage />);

    expect(await screen.findByText('RSVP Night')).toBeInTheDocument();
    expect(screen.getByText('General Admission')).toBeInTheDocument();
    // Fixture passes never leak into the real wallet.
    expect(screen.queryByText('AFTER HOURS: TECHNO RITUAL')).not.toBeInTheDocument();
    expect(screen.queryByText('NEON RITUAL VOL. 3')).not.toBeInTheDocument();
  });

  it('shows the empty state when the wallet has no passes', async () => {
    authenticate();
    mockWalletFeed([]);
    render(<TicketsPage />);

    expect(await screen.findByText('NO CURRENT PASSES YET')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'EXPLORE EVENTS' })).toBeInTheDocument();
  });

  it('shows an empty state (not the guest showcase) when the wallet read fails', async () => {
    authenticate();
    mockBffGet.mockRejectedValue(new Error('gateway down'));
    render(<TicketsPage />);

    expect(await screen.findByText('NO CURRENT PASSES YET')).toBeInTheDocument();
    expect(screen.queryByText('YOUR PASS TO THE CIRCLE')).not.toBeInTheDocument();
  });

  it('switches to history tab and displays past tickets', async () => {
    authenticate();
    mockBffGet.mockResolvedValue({
      items: [{ ...ENTITLEMENT, id: 'ENT-past-1', status: 'redeemed', scanCount: 1 }],
      pageInfo: { page: 1, pageSize: 50, total: 1, hasNextPage: false },
    });
    mockApiGet.mockImplementation((arg: unknown) => {
      const { path } = arg as { path: string };
      if (path === '/api/v2/public/events/evt_rsvp_1') {
        return Promise.resolve({ ...REAL_EVENT, endAt: '2026-01-02T00:00:00.000Z' });
      }
      if (path === '/api/v2/public/venues/by-id/ven_1') return Promise.resolve(REAL_VENUE);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });
    render(<TicketsPage />);

    // A fully-scanned ticket lives in history, not current passes.
    expect(await screen.findByText('NO CURRENT PASSES YET')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'HISTORY' }));
    expect(screen.getByText('RSVP Night')).toBeInTheDocument();
  });

  it('opens the pass preview for a real ticket', async () => {
    authenticate();
    mockWalletFeed();
    render(<TicketsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'VIEW PASS PREVIEW' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Tier shows on both the card and the open preview.
    expect(screen.getAllByText('General Admission')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Close ticket view' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
