import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppShell } from '@/components/app-shell';

import type { User } from '@c1rcle/contracts';

// The console's shell is auth-gated, so the e2e smoke spec cannot reach the
// primary navigation landmark (every route redirects to /login without a
// session). This component test renders the shell with a mocked session and
// keeps the "primary navigation is labelled for assistive technology"
// guarantee covered.
const { mockUser } = vi.hoisted(() => ({
  mockUser: {
    id: 'admin-1',
    email: 'platform@c1rcle.app',
    name: 'Platform Admin',
  } as unknown as User,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@c1rcle/auth', () => ({
  logout: vi.fn(),
  useSession: () => ({ user: mockUser }),
}));

vi.mock('@c1rcle/providers', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

describe('C1RCLE Admin Console AppShell', () => {
  it('labels the primary navigation landmark for assistive technology', () => {
    render(
      <AppShell initialUser={{ user: mockUser }}>
        <div>Overview content</div>
      </AppShell>,
    );

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toBeInTheDocument();
    // The Overview item is active for the mocked '/' pathname.
    expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
