import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { login } from '@c1rcle/auth';

import { activateOrganizationWorkspace } from '@/lib/org/active-org';
import { getOrganizations } from '@/lib/org/org-repository';
import { filterOrgsByPartnerType, resolveLandingPath } from '@/lib/org/route-after-auth';

import LoginPage from './PageClient';

const { router, searchParams, sessionState } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  searchParams: new URLSearchParams('type=venue'),
  sessionState: { status: 'anonymous', session: null },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));

vi.mock('@c1rcle/auth', () => ({
  login: vi.fn(),
  useSessionStore: Object.assign(
    vi.fn(() => sessionState),
    {
      getState: () => sessionState,
    },
  ),
}));

vi.mock('@/lib/org/active-org', () => ({ activateOrganizationWorkspace: vi.fn() }));
vi.mock('@/lib/org/org-repository', () => ({ getOrganizations: vi.fn().mockResolvedValue([]) }));
vi.mock('@/lib/org/route-after-auth', () => ({
  filterOrgsByPartnerType: vi.fn(() => []),
  resolveLandingPath: vi.fn().mockResolvedValue('/partner/venue/overview'),
  redirectToFirstPendingInvite: vi.fn().mockResolvedValue(false),
}));
vi.mock('@/lib/safe-next-path', () => ({ safeNextPath: vi.fn(() => null) }));

describe('Partner login', () => {
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

  it('rehydrates an approved workspace after login rather than keeping stale provider state', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValue({
      id: 'synthetic-user',
      email: 'synthetic@example.invalid',
      displayName: 'Synthetic User',
      role: 'partner',
      avatarUrl: null,
      mustChangePassword: false,
      emailVerified: true,
    });
    const org = { id: 'approved-venue' } as Awaited<ReturnType<typeof getOrganizations>>[number];
    vi.mocked(getOrganizations).mockResolvedValue([org]);
    vi.mocked(filterOrgsByPartnerType).mockResolvedValue([org]);
    vi.mocked(resolveLandingPath).mockResolvedValue('/partner/venue/overview');
    render(<LoginPage />);
    await user.type(screen.getByLabelText('Email Address'), 'synthetic@example.invalid');
    await user.type(screen.getByLabelText('Password'), 'synthetic-existing-password');
    await user.click(screen.getByRole('button', { name: 'Continue to Dashboard' }));
    expect(activateOrganizationWorkspace).toHaveBeenCalledWith(
      'approved-venue',
      '/partner/venue/overview',
    );
    expect(router.push).not.toHaveBeenCalled();
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
