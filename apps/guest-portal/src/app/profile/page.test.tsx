import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';
import { clearSession, useSessionStore } from '@c1rcle/auth';

import { ProfileLoggedOutView } from '@/features/profile/components/ProfileLoggedOutView';

import ProfilePage from './page';

const mockBffGet = vi.fn<(...args: readonly unknown[]) => Promise<unknown>>();
const mockApiGet = vi.fn<(...args: readonly unknown[]) => Promise<unknown>>();

vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: { get: (...args: unknown[]) => mockBffGet(...args) },
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: (...args: unknown[]) => mockApiGet(...args) },
}));

const replace = vi.fn<(href: string) => void>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/lib/auth/require-session', () => ({
  requireGuestSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: 'usr_live_1',
        email: 'anaya@example.com',
        displayName: 'Anaya Mehta',
        role: 'guest',
        avatarUrl: null,
        mustChangePassword: false,
      },
    }),
  ),
}));

const PROFILE = {
  userId: 'usr_live_1',
  displayName: 'Anaya Mehta',
  dateOfBirth: '1999-05-10',
  city: 'Pune',
  tastes: ['Techno', 'House', 'Open mic'],
  intents: ['Network'],
  createdAt: '2025-03-14T00:00:00.000Z',
  updatedAt: '2025-03-14T00:00:00.000Z',
};

const ENTITLEMENT = {
  id: 'ENT-live-1',
  orderId: 'ORD-live-1',
  eventId: 'evt_live_1',
  organizationId: 'org_1',
  tierId: 'tier_live_1',
  tierName: 'Gallery Pass',
  userId: 'usr_live_1',
  holderName: 'Anaya Mehta',
  status: 'valid',
  scanCountAllowed: 1,
  scanCount: 0,
  scannedAt: [],
  version: 1,
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

const REAL_EVENT = {
  id: 'evt_live_1',
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

const PAGE_INFO = {
  page: 1,
  pageSize: 50,
  total: 1,
  hasNextPage: false,
};

function mockLiveProfile() {
  mockBffGet.mockImplementation((arg: unknown) => {
    const { path } = arg as { path: string };
    if (path === '/api/profile/me') return Promise.resolve(PROFILE);
    if (path === '/api/wallet/tickets')
      return Promise.resolve({ items: [ENTITLEMENT], pageInfo: PAGE_INFO });
    return Promise.reject(new Error(`unexpected bff path ${path}`));
  });
  mockApiGet.mockImplementation((arg: unknown) => {
    const { path } = arg as { path: string };
    if (path === '/api/v2/public/events/evt_live_1') return Promise.resolve(REAL_EVENT);
    if (path === '/api/v2/public/venues/by-id/ven_1') return Promise.resolve(REAL_VENUE);
    return Promise.reject(new Error(`unexpected api path ${path}`));
  });
}

describe('ProfilePage live profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
    mockBffGet.mockReset();
    mockApiGet.mockReset();
  });

  it('renders the session identity with profile city and joined date, no fixture', async () => {
    mockLiveProfile();
    render(await ProfilePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Anaya Mehta' })).toBeInTheDocument();
    // Only the profile document can supply the city + join date.
    expect(await screen.findByText('Pune · Joined Mar 2025')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Profile sections' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Your C1RCLE at a glance' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/UI PREVIEW|FIXTURE DATA/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /logged in|guest showcase/i }),
    ).not.toBeInTheDocument();
    // Fixture-only identity never leaks into the live header.
    expect(screen.queryByText(/riya@example\.com/i)).not.toBeInTheDocument();
  });

  it('shows real upcoming passes and never the fixture events', async () => {
    mockLiveProfile();
    render(await ProfilePage({ searchParams: Promise.resolve({ view: 'events' }) }));

    expect(await screen.findByRole('heading', { name: 'RSVP Night' })).toBeInTheDocument();
    expect(screen.getByText('Gallery Pass')).toBeInTheDocument();
    expect(screen.queryByText('Rooftop Jazz')).not.toBeInTheDocument();
    expect(screen.queryByText('Art Collective')).not.toBeInTheDocument();
  });

  it('filters to attended events from the real wallet', async () => {
    mockBffGet.mockImplementation((arg: unknown) => {
      const { path } = arg as { path: string };
      if (path === '/api/profile/me') return Promise.resolve(PROFILE);
      return Promise.resolve({
        items: [{ ...ENTITLEMENT, id: 'ENT-done-1', status: 'redeemed', scanCount: 1 }],
        pageInfo: PAGE_INFO,
      });
    });
    mockApiGet.mockImplementation((arg: unknown) => {
      const { path } = arg as { path: string };
      if (path === '/api/v2/public/events/evt_live_1') return Promise.resolve(REAL_EVENT);
      if (path === '/api/v2/public/venues/by-id/ven_1') return Promise.resolve(REAL_VENUE);
      return Promise.reject(new Error(`unexpected api path ${path}`));
    });
    render(
      await ProfilePage({ searchParams: Promise.resolve({ view: 'events', filter: 'attended' }) }),
    );

    expect(await screen.findByRole('heading', { name: 'RSVP Night' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Upcoming' })).not.toBeInTheDocument();
  });

  it('falls back to the session identity when no profile is saved yet (404)', async () => {
    mockBffGet.mockImplementation((arg: unknown) => {
      const { path } = arg as { path: string };
      if (path === '/api/profile/me') {
        return Promise.reject(
          new ApiClientError({
            code: 'not_found',
            message: 'Guest profile',
            status: 404,
            requestId: undefined,
            fieldErrors: undefined,
          }),
        );
      }
      return Promise.resolve({ items: [], pageInfo: PAGE_INFO });
    });
    render(await ProfilePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Anaya Mehta' })).toBeInTheDocument();
    expect(await screen.findByText('Your C1RCLE at a glance')).toBeInTheDocument();
    expect(screen.queryByText('Pune')).not.toBeInTheDocument();
  });

  it('renders an empty events list when the wallet read fails, never fixtures', async () => {
    mockBffGet.mockImplementation((arg: unknown) => {
      const { path } = arg as { path: string };
      if (path === '/api/profile/me') return Promise.resolve(PROFILE);
      return Promise.reject(new Error('gateway down'));
    });
    render(await ProfilePage({ searchParams: Promise.resolve({ view: 'events' }) }));

    expect(await screen.findByText('No upcoming events yet.')).toBeInTheDocument();
    expect(screen.queryByText('Rooftop Jazz')).not.toBeInTheDocument();
  });

  it('shows the real email on the account panel with no invented method row', async () => {
    mockLiveProfile();
    render(
      await ProfilePage({
        searchParams: Promise.resolve({ view: 'settings', section: 'account' }),
      }),
    );

    expect(await screen.findByText('anaya@example.com')).toBeInTheDocument();
    // No endpoint exposes the phone number or the sign-in method, so those rows
    // are omitted rather than filled with a fixture value.
    expect(screen.queryByText('Phone')).not.toBeInTheDocument();
    expect(screen.queryByText('Method')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('supports local personal-setting validation and reset without claiming persistence', async () => {
    mockLiveProfile();
    render(
      await ProfilePage({
        searchParams: Promise.resolve({ view: 'settings', section: 'personal' }),
      }),
    );

    const nameInput = await screen.findByLabelText('Full name');
    expect(nameInput).toHaveValue('Anaya Mehta');

    fireEvent.change(nameInput, { target: { value: 'R' } });
    fireEvent.blur(nameInput);
    expect(screen.getByText('Enter at least two characters.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset changes' }));
    expect(nameInput).toHaveValue('Anaya Mehta');
    expect(screen.queryByText('Enter at least two characters.')).not.toBeInTheDocument();
    expect(screen.queryByText(/saved successfully/i)).not.toBeInTheDocument();
  });

  it('clears the local session and returns to login after sign-out confirmation', async () => {
    mockLiveProfile();
    useSessionStore.setState({ accessToken: 'live-access-token', status: 'authenticated' });
    render(
      await ProfilePage({
        searchParams: Promise.resolve({ view: 'settings', section: 'account' }),
      }),
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
    expect(screen.getByRole('dialog', { name: 'End this session?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm sign out' }));

    await waitFor(() => {
      expect(useSessionStore.getState().status).toBe('anonymous');
    });
    expect(replace).toHaveBeenCalledWith('/login?next=/profile');
  });

  it('provides a pure logged-out view with a safe return target', () => {
    render(<ProfileLoggedOutView />);

    expect(screen.getByRole('link', { name: 'Continue to login' })).toHaveAttribute(
      'href',
      '/login?next=/profile',
    );
  });
});
