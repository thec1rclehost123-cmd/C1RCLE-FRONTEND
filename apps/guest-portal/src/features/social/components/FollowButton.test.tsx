import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FollowButton } from './FollowButton';

import type { FollowActionResult } from '../actions';

const setFollowingAction =
  vi.fn<(type: string, id: string, following: boolean) => Promise<FollowActionResult>>();

vi.mock('../actions', () => ({
  setFollowingAction: (type: string, id: string, following: boolean) =>
    setFollowingAction(type, id, following),
}));

const props = {
  targetType: 'venue',
  targetId: 'venue-1',
  targetName: 'Toit',
  loginHref: '/login?next=%2Fvenue%2Ftoit',
} as const;

describe('FollowButton', () => {
  beforeEach(() => {
    setFollowingAction.mockReset();
  });

  it('sends an anonymous guest to sign in with a return path', () => {
    render(<FollowButton {...props} initialState={{ kind: 'anonymous' }} />);

    expect(screen.getByRole('link', { name: 'Sign in to follow Toit' })).toHaveAttribute(
      'href',
      '/login?next=%2Fvenue%2Ftoit',
    );
  });

  it('follows optimistically and settles on the server count', async () => {
    setFollowingAction.mockResolvedValue({ status: 'ok', following: true, followerCount: 43 });
    render(
      <FollowButton
        {...props}
        initialState={{ kind: 'ready', following: false, followerCount: 41 }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Follow Toit' }));

    expect(screen.getByRole('button', { name: 'Unfollow Toit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(setFollowingAction).toHaveBeenCalledWith('venue', 'venue-1', true);
    expect(await screen.findByText('43 followers')).toBeInTheDocument();
  });

  it('rolls back and explains when the command fails', async () => {
    setFollowingAction.mockResolvedValue({ status: 'error' });
    render(
      <FollowButton
        {...props}
        initialState={{ kind: 'ready', following: true, followerCount: 1 }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Unfollow Toit' }));

    expect(await screen.findByText('Could not update. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unfollow Toit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('1 follower')).toBeInTheDocument();
  });

  it('falls back to the sign-in link when the session has expired', async () => {
    setFollowingAction.mockResolvedValue({ status: 'unauthenticated' });
    render(
      <FollowButton
        {...props}
        initialState={{ kind: 'ready', following: false, followerCount: null }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Follow Toit' }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Sign in to follow Toit' })).toBeInTheDocument();
    });
  });
});
