import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FollowingPage from './page';

import type { FollowTargetSummary, SessionResult } from '@/lib/social/social-api';
import type { FollowListResponse } from '@c1rcle/contracts';

const listMyFollows = vi.fn<(input: unknown) => Promise<SessionResult<FollowListResponse>>>();
const resolveFollowTarget =
  vi.fn<(type: string, id: string) => Promise<FollowTargetSummary | null>>();

vi.mock('@/lib/social/social-api', () => ({
  listMyFollows: (input: unknown) => listMyFollows(input),
  resolveFollowTarget: (type: string, id: string) => resolveFollowTarget(type, id),
}));

vi.mock('@/lib/auth/require-session', () => ({
  requireGuestSession: vi.fn(() => Promise.resolve({ user: { id: 'guest-1' } })),
}));

vi.mock('@/features/social/actions', () => ({
  setFollowingAction: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

function follow(targetType: 'venue' | 'host', targetId: string) {
  return {
    id: `guest-1__${targetType}__${targetId}`,
    targetType,
    targetId,
    createdAt: '2026-10-01T10:00:00.000Z',
  };
}

describe('FollowingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists followed venues and hosts with profile links and unfollow controls', async () => {
    listMyFollows.mockResolvedValue({
      status: 'ok',
      data: {
        items: [follow('venue', 'v-1'), follow('host', 'org-1'), follow('venue', 'gone')],
        nextCursor: null,
        pageInfo: { page: 1, pageSize: 20, total: 3, hasNextPage: false },
      },
    });
    resolveFollowTarget.mockImplementation((type, id) =>
      Promise.resolve(
        id === 'gone'
          ? null
          : type === 'venue'
            ? { name: 'Toit', href: '/venue/toit' }
            : { name: 'Kitty Su', href: '/host/kitty-su' },
      ),
    );

    render(await FollowingPage());

    expect(screen.getByRole('link', { name: 'Toit' })).toHaveAttribute('href', '/venue/toit');
    expect(screen.getByRole('link', { name: 'Kitty Su' })).toHaveAttribute(
      'href',
      '/host/kitty-su',
    );
    expect(screen.getByText('Unavailable profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unfollow Toit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows an empty state that points to discovery', async () => {
    listMyFollows.mockResolvedValue({
      status: 'ok',
      data: {
        items: [],
        nextCursor: null,
        pageInfo: { page: 1, pageSize: 20, total: 0, hasNextPage: false },
      },
    });

    render(await FollowingPage());

    expect(screen.getByText("You're not following anyone yet")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find venues & hosts' })).toHaveAttribute(
      'href',
      '/hosts',
    );
  });
});
