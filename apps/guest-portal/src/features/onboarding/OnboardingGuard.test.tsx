import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readOnboarding } from './client';
import { OnboardingGuard } from './OnboardingGuard';

const { replace, session, route } = vi.hoisted(() => ({
  replace: vi.fn(),
  route: { pathname: '/checkout' },
  session: {
    hydrated: true,
    status: 'authenticated',
    session: { user: { id: 'guest', emailVerified: true } },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => route.pathname,
}));
vi.mock('@c1rcle/auth', () => ({
  useSessionStore: Object.assign(() => session, { getState: () => session }),
}));
vi.mock('./client', () => ({ readOnboarding: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  session.session.user.emailVerified = true;
  session.status = 'authenticated';
  route.pathname = '/checkout';
  window.history.replaceState({}, '', '/');
});
describe('authoritative direct-visit resume', () => {
  it('redirects incomplete Guests on a normal authenticated visit', async () => {
    vi.mocked(readOnboarding).mockResolvedValue({ complete: false } as never);
    render(<OnboardingGuard />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/onboarding?next=%2Fcheckout');
    });
  });
  it('leaves completed Guests at their destination', async () => {
    vi.mocked(readOnboarding).mockResolvedValue({ complete: true } as never);
    render(<OnboardingGuard />);
    await waitFor(() => {
      expect(readOnboarding).toHaveBeenCalled();
    });
    expect(replace).not.toHaveBeenCalled();
  });
  it('does not bypass email verification', () => {
    session.session.user.emailVerified = false;
    render(<OnboardingGuard />);
    expect(replace).toHaveBeenCalledWith('/verify-email?next=%2Fcheckout');
    expect(readOnboarding).not.toHaveBeenCalled();
  });
  it.each(['/', '/explore', '/search', '/event/public-event', '/hosts', '/venues/public-venue'])(
    'allows anonymous and incomplete authenticated browsing at %s',
    (pathname) => {
      route.pathname = pathname;
      const view = render(<OnboardingGuard />);
      expect(readOnboarding).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
      view.unmount();
      session.status = 'anonymous';
      render(<OnboardingGuard />);
      expect(readOnboarding).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    },
  );
  it('preserves the protected checkout query when resuming onboarding', async () => {
    window.history.replaceState({}, '', '/checkout?eventId=fixture-event&tierId=fixture-tier');
    vi.mocked(readOnboarding).mockResolvedValue({ complete: false } as never);
    render(<OnboardingGuard />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        '/onboarding?next=%2Fcheckout%3FeventId%3Dfixture-event%26tierId%3Dfixture-tier',
      );
    });
  });

  it('withholds protected controls until completion is confirmed', async () => {
    let resolve: ((value: never) => void) | undefined;
    vi.mocked(readOnboarding).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(
      <OnboardingGuard>
        <button>Protected action</button>
      </OnboardingGuard>,
    );
    expect(screen.queryByRole('button', { name: 'Protected action' })).not.toBeInTheDocument();
    resolve?.({ complete: true } as never);
    expect(await screen.findByRole('button', { name: 'Protected action' })).toBeInTheDocument();
  });
  it('renders public discovery immediately without checking onboarding', () => {
    route.pathname = '/explore';
    render(
      <OnboardingGuard>
        <button>Browse events</button>
      </OnboardingGuard>,
    );
    expect(screen.getByRole('button', { name: 'Browse events' })).toBeInTheDocument();
    expect(readOnboarding).not.toHaveBeenCalled();
  });
});
