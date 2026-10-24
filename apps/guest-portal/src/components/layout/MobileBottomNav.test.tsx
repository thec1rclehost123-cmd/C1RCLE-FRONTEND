import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MobileBottomNav } from './MobileBottomNav';

const state = vi.hoisted(() => ({ pathname: '/', isAuthenticated: false }));

vi.mock('next/navigation', () => ({ usePathname: () => state.pathname }));
vi.mock('@c1rcle/auth', () => ({ useSession: () => ({ isAuthenticated: state.isAuthenticated }) }));

beforeEach(() => {
  state.pathname = '/';
  state.isAuthenticated = false;
});

describe('MobileBottomNav', () => {
  it('links to real Guest routes and uses login for signed-out visitors', () => {
    render(<MobileBottomNav />);

    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/login');
  });

  it('keeps the dock off event and checkout screens', () => {
    state.pathname = '/event/real-night';
    const { rerender } = render(<MobileBottomNav />);
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();

    state.pathname = '/checkout/real-night';
    rerender(<MobileBottomNav />);
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });

  it('links to the owner profile when signed in', () => {
    state.isAuthenticated = true;
    state.pathname = '/profile';
    render(<MobileBottomNav />);
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  });
});
