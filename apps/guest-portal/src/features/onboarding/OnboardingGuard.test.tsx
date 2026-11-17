import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readOnboardingStatus } from './client';
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
vi.mock('./client', () => ({ readOnboarding: vi.fn(), readOnboardingStatus: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  session.session.user.emailVerified = true;
  session.status = 'authenticated';
  route.pathname = '/checkout';
  window.history.replaceState({}, '', '/');
});
describe('authoritative direct-visit resume', () => {
  it('redirects incomplete Guests on a normal authenticated visit', async () => {
    vi.mocked(readOnboardingStatus).mockResolvedValue({ complete: false } as never);
    render(<OnboardingGuard />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/onboarding?next=%2Fcheckout');
    });
  });
  it('leaves completed Guests at their destination', async () => {
    vi.mocked(readOnboardingStatus).mockResolvedValue({ complete: true } as never);
    render(<OnboardingGuard />);
    await waitFor(() => {
      expect(readOnboardingStatus).toHaveBeenCalled();
    });
    expect(replace).not.toHaveBeenCalled();
  });
  it('does not bypass email verification', () => {
    session.session.user.emailVerified = false;
    render(<OnboardingGuard />);
    expect(replace).toHaveBeenCalledWith('/verify-email?next=%2Fcheckout');
    expect(readOnboardingStatus).not.toHaveBeenCalled();
  });
  it.each(['/', '/explore', '/search', '/event/public-event', '/hosts', '/venues/public-venue'])(
    'routes incomplete authenticated Guests to onboarding but keeps anonymous browsing public at %s',
    async (pathname) => {
      route.pathname = pathname;
      vi.mocked(readOnboardingStatus).mockResolvedValue({ complete: false } as never);
      const view = render(<OnboardingGuard />);
      await waitFor(() => {
        expect(readOnboardingStatus).toHaveBeenCalled();
        expect(replace).toHaveBeenCalledWith(`/onboarding?next=${encodeURIComponent(pathname)}`);
      });
      view.unmount();
      vi.clearAllMocks();
      session.status = 'anonymous';
      render(<OnboardingGuard />);
      expect(readOnboardingStatus).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    },
  );
  it('preserves the protected checkout query when resuming onboarding', async () => {
    window.history.replaceState({}, '', '/checkout?eventId=fixture-event&tierId=fixture-tier');
    vi.mocked(readOnboardingStatus).mockResolvedValue({ complete: false } as never);
    render(<OnboardingGuard />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        '/onboarding?next=%2Fcheckout%3FeventId%3Dfixture-event%26tierId%3Dfixture-tier',
      );
    });
  });

  it('withholds protected controls until completion is confirmed', async () => {
    let resolve: ((value: never) => void) | undefined;
    vi.mocked(readOnboardingStatus).mockReturnValue(
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
  it('withholds authenticated public discovery until onboarding is confirmed', async () => {
    route.pathname = '/explore';
    vi.mocked(readOnboardingStatus).mockResolvedValue({ complete: true } as never);
    render(
      <OnboardingGuard>
        <button>Browse events</button>
      </OnboardingGuard>,
    );
    expect(await screen.findByRole('button', { name: 'Browse events' })).toBeInTheDocument();
    expect(readOnboardingStatus).toHaveBeenCalledOnce();
  });
});
