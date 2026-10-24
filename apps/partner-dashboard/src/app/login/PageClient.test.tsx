import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from './PageClient';

const { router, searchParams, sessionState } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  searchParams: new URLSearchParams('type=venue'),
  sessionState: { status: 'anonymous' as string, session: null as null },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));

vi.mock('@c1rcle/auth', () => ({
  login: vi.fn(),
  useSessionStore: Object.assign(vi.fn(() => sessionState), {
    getState: () => sessionState,
  }),
}));

vi.mock('@/lib/org/active-org', () => ({ setActiveOrg: vi.fn() }));
vi.mock('@/lib/org/org-repository', () => ({ getOrganizations: vi.fn().mockResolvedValue([]) }));
vi.mock('@/lib/org/route-after-auth', () => ({
  filterOrgsByPartnerType: vi.fn(() => []),
  redirectToFirstPendingInvite: vi.fn().mockResolvedValue(false),
}));
vi.mock('@/lib/safe-next-path', () => ({ safeNextPath: vi.fn(() => null) }));

describe('Partner login accessibility', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    router.push.mockReset();
    router.replace.mockReset();
    sessionState.status = 'anonymous';
    sessionState.session = null;
  });

  it('gives the password visibility toggle an accessible name that tracks its state', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
  });
});
