import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearSession, useSessionStore } from '@c1rcle/auth';

import { ProfileLoggedOutView } from '@/features/profile/components/ProfileLoggedOutView';

import ProfilePage from './page';

vi.mock('next/image', () => ({
  default: ({ alt, fill: _fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const replace = vi.fn<(href: string) => void>();
const mockApiGet = vi.fn<(...args: readonly unknown[]) => Promise<unknown>>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ toString: () => 'better-auth.session_token=test' }),
}));

vi.mock('@c1rcle/api-client', () => ({
  createApiClient: () => ({ get: (...args: unknown[]) => mockApiGet(...args) }),
  isApiClientError: (value: unknown) =>
    typeof value === 'object' && value !== null && 'status' in value,
}));

vi.mock('@/lib/auth/require-session', () => ({
  requireGuestSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: 'test-user',
        email: 'aayush@example.com',
        displayName: 'Aayush Divase',
        role: 'guest',
        avatarUrl: null,
        mustChangePassword: false,
      },
    }),
  ),
}));

const GUEST_PROFILE = {
  userId: 'test-user',
  displayName: 'Aayush Divase',
  dateOfBirth: '2000-01-01',
  city: 'Tempe',
  tastes: ['music', 'art', 'food'],
  intents: ['discover'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
    mockApiGet.mockImplementation((arg: unknown) => {
      const { path } = arg as { path: string };
      if (path === '/api/v2/profile/me') return Promise.resolve(GUEST_PROFILE);
      if (path === '/api/v2/orders?limit=50') {
        return Promise.resolve({
          items: [],
          pageInfo: { page: 1, pageSize: 50, total: 0, hasNextPage: false },
        });
      }
      if (path === '/api/v2/wallet/tickets?limit=50') {
        return Promise.resolve({
          items: [],
          pageInfo: { page: 1, pageSize: 50, total: 0, hasNextPage: false },
        });
      }
      return Promise.reject(new Error(`unexpected path ${path}`));
    });
  });

  it('renders the authenticated profile identity without fixture data', async () => {
    render(await ProfilePage({}));

    expect(screen.getByRole('heading', { level: 1, name: 'Aayush Divase' })).toBeInTheDocument();
    expect(screen.getByText('Tempe')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Profile sections' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open profile settings' })).toHaveAttribute(
      'href',
      '/profile?view=settings&section=social#social-links',
    );
    expect(screen.getByRole('link', { name: 'Edit profile name' })).toHaveAttribute(
      'href',
      '/profile?view=settings&section=personal#profile-settings',
    );
    expect(
      screen.getByRole('link', { name: 'Add Instagram profile link in settings' }),
    ).toHaveAttribute('href', '/profile?view=settings&section=social#social-links');
    expect(screen.getByRole('link', { name: 'Add X profile link in settings' })).toHaveAttribute(
      'href',
      '/profile?view=settings&section=social#social-links',
    );
    expect(screen.queryByText(/your c1rcle/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upcoming events' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Events you’ve attended' })).toBeInTheDocument();
    expect(
      screen.queryByText(/events attended|tickets booked|total spent/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/UI PREVIEW|FIXTURE DATA/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /logged in|guest showcase/i }),
    ).not.toBeInTheDocument();
  });

  it('renders honest empty event states instead of fixture history', async () => {
    const { rerender } = render(
      await ProfilePage({ searchParams: Promise.resolve({ view: 'events' }) }),
    );

    expect(screen.getByText('No upcoming events yet.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rooftop Jazz' })).not.toBeInTheDocument();

    rerender(
      await ProfilePage({
        searchParams: Promise.resolve({ filter: 'attended', view: 'events' }),
      }),
    );
    expect(screen.getByText('No attended events yet.')).toBeInTheDocument();
  });

  it('requires a past event and a non-refunded redeemed scan to show attendance', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const order = (id: string, eventId: string, status = 'paid', refundedPaise = 0) => ({
      id,
      eventId,
      status,
      refundedPaise,
      eventCancellation: null,
      createdAt: yesterday,
      bookingReference: `C1-${id}`,
      grandTotalPaise: 10_000,
    });
    const events: Record<string, unknown> = {
      past_scanned: {
        id: 'past_scanned',
        slug: 'past-scanned',
        title: 'Past scanned event',
        startAt: yesterday,
        venue: { name: 'Venue', address: { city: 'Pune' } },
        imageUrl: null,
      },
      past_unscanned: {
        id: 'past_unscanned',
        slug: 'past-unscanned',
        title: 'Past unscanned event',
        startAt: yesterday,
        venue: { name: 'Venue', address: { city: 'Pune' } },
        imageUrl: null,
      },
      future_scanned: {
        id: 'future_scanned',
        slug: 'future-scanned',
        title: 'Future scanned event',
        startAt: tomorrow,
        venue: { name: 'Venue', address: { city: 'Pune' } },
        imageUrl: null,
      },
      refunded: {
        id: 'refunded',
        slug: 'refunded',
        title: 'Refunded event',
        startAt: yesterday,
        venue: { name: 'Venue', address: { city: 'Pune' } },
        imageUrl: null,
      },
      cancelled: {
        id: 'cancelled',
        slug: 'cancelled',
        title: 'Cancelled event',
        startAt: yesterday,
        venue: { name: 'Venue', address: { city: 'Pune' } },
        imageUrl: null,
      },
    };
    const orders = [
      order('order_scanned', 'past_scanned'),
      order('order_unscanned', 'past_unscanned'),
      order('order_future', 'future_scanned'),
      order('order_refunded', 'refunded', 'refunded', 10_000),
      order('order_cancelled', 'cancelled', 'cancelled'),
    ];
    mockApiGet.mockImplementation((arg: unknown) => {
      const { path } = arg as { path: string };
      if (path === '/api/v2/profile/me') return Promise.resolve(GUEST_PROFILE);
      if (path === '/api/v2/orders?limit=50') {
        return Promise.resolve({
          items: orders,
          pageInfo: { page: 1, pageSize: 50, total: orders.length, hasNextPage: false },
        });
      }
      if (path === '/api/v2/wallet/tickets?limit=50') {
        return Promise.resolve({
          items: [
            { orderId: 'order_scanned', status: 'redeemed', scanCount: 1 },
            { orderId: 'order_unscanned', status: 'valid', scanCount: 0 },
            { orderId: 'order_future', status: 'redeemed', scanCount: 1 },
            { orderId: 'order_refunded', status: 'redeemed', scanCount: 1 },
            { orderId: 'order_cancelled', status: 'void', scanCount: 0 },
          ],
          pageInfo: { page: 1, pageSize: 50, total: 5, hasNextPage: false },
        });
      }
      const eventId = path.slice('/api/v2/public/events/'.length);
      if (eventId in events) return Promise.resolve(events[eventId]);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    render(
      await ProfilePage({
        searchParams: Promise.resolve({ filter: 'attended', view: 'events' }),
      }),
    );

    expect(screen.getByRole('heading', { name: 'Past scanned event' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Past unscanned event' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Future scanned event' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Refunded event' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cancelled event' })).not.toBeInTheDocument();
  });

  it('does not claim an empty attended history when the wallet read failed', async () => {
    mockApiGet.mockImplementation((arg: unknown) => {
      const { path } = arg as { path: string };
      if (path === '/api/v2/profile/me') return Promise.resolve(GUEST_PROFILE);
      if (path === '/api/v2/orders?limit=50') {
        return Promise.resolve({
          items: [],
          pageInfo: { page: 1, pageSize: 50, total: 0, hasNextPage: false },
        });
      }
      if (path === '/api/v2/wallet/tickets?limit=50') {
        return Promise.reject(new Error('wallet unavailable'));
      }
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    render(
      await ProfilePage({
        searchParams: Promise.resolve({ filter: 'attended', view: 'events' }),
      }),
    );

    expect(screen.getByText('Attendance history is temporarily unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('No attended events yet.')).not.toBeInTheDocument();
  });

  it('validates and resets unsaved personal-profile changes', async () => {
    render(
      await ProfilePage({
        searchParams: Promise.resolve({ section: 'personal', view: 'settings' }),
      }),
    );

    const nameInput = screen.getByLabelText('Full name');
    fireEvent.change(nameInput, { target: { value: 'R' } });
    fireEvent.blur(nameInput);
    expect(screen.getByText('Enter at least two characters.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset changes' }));
    expect(nameInput).toHaveValue('Aayush Divase');
    expect(screen.queryByText('Enter at least two characters.')).not.toBeInTheDocument();
    expect(screen.queryByText(/saved successfully/i)).not.toBeInTheDocument();
  });

  it('shows social settings without pretending unsupported links can be saved', async () => {
    render(
      await ProfilePage({
        searchParams: Promise.resolve({ section: 'social', view: 'settings' }),
      }),
    );

    expect(screen.getByRole('heading', { name: 'Instagram & X' })).toBeInTheDocument();
    expect(screen.getByText(/not supported by the Guest profile service yet/i)).toBeInTheDocument();
    expect(screen.getByText('Instagram', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('X', { exact: true })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save.*social/i })).not.toBeInTheDocument();
  });

  it('clears the local session and returns to login after sign-out confirmation', async () => {
    useSessionStore.setState({ accessToken: 'fixture-access-token', status: 'authenticated' });
    render(
      await ProfilePage({
        searchParams: Promise.resolve({ section: 'account', view: 'settings' }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
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
