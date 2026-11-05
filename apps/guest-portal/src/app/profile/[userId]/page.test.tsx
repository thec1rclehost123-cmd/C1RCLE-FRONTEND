import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PublicProfilePage, { dynamic, generateMetadata } from './page';

const mocks = vi.hoisted(() => ({ get: vi.fn(), session: vi.fn() }));
vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    unoptimized: _unoptimized,
    ...props
  }: React.ComponentProps<'img'> & { fill?: boolean; unoptimized?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ''} />
  ),
}));
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ toString: () => 'better-auth.session_token=synthetic' }),
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/lib/auth/require-session', () => ({ requireGuestSession: mocks.session }));
vi.mock('@c1rcle/api-client', () => ({
  createApiClient: () => ({ get: mocks.get }),
  isApiClientError: (error: unknown) =>
    typeof error === 'object' && error !== null && 'status' in error,
}));
const profile = {
  identity: {
    id: 'guest-b',
    displayName: 'Synthetic Guest B',
    avatarUrl: null,
    interests: ['House'],
  },
  upcomingEvents: [],
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: 'guest-a' } });
  mocks.get.mockResolvedValue(profile);
});
describe('founder-approved Guest social profile', () => {
  it('requires the viewer session and loads only the dedicated social projection', async () => {
    render(await PublicProfilePage({ params: Promise.resolve({ userId: 'guest-b' }) }));
    expect(mocks.session).toHaveBeenCalledWith('/profile/guest-b');
    expect(mocks.get).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v2/social/profiles/guest-b' }),
    );
    expect(screen.getByRole('heading', { name: 'Synthetic Guest B' })).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Block Guest' })).toBeInTheDocument();
  });
  it.each(['private', 'blocked', 'missing'])(
    'uses the same unavailable response for a %s profile',
    async () => {
      mocks.get.mockRejectedValue({ status: 404 });
      await expect(
        PublicProfilePage({ params: Promise.resolve({ userId: 'guest-b' }) }),
      ).rejects.toThrow('NEXT_NOT_FOUND');
    },
  );
  it('keeps metadata generic, private and free of identity fields', () => {
    expect(dynamic).toBe('force-dynamic');
    expect(generateMetadata().robots).toMatchObject({ index: false });
    expect(JSON.stringify(generateMetadata())).not.toContain('Synthetic Guest B');
  });
  it('does not substitute fixture identities when the service is unavailable', async () => {
    mocks.get.mockRejectedValue({ status: 503 });
    render(await PublicProfilePage({ params: Promise.resolve({ userId: 'guest-b' }) }));
    expect(screen.getByRole('heading', { name: 'Profile unavailable' })).toBeInTheDocument();
    expect(screen.queryByText('Synthetic Guest B')).not.toBeInTheDocument();
  });
});
