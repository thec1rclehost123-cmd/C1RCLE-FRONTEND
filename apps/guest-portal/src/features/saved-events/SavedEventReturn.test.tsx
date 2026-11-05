import { render, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { OnboardingGuard } from '@/features/onboarding/OnboardingGuard';

import { SavedEventReturn } from './SavedEventReturn';

const mocks = vi.hoisted(() => ({
  router: { replace: vi.fn() },
  read: vi.fn(),
  session: {
    hydrated: true,
    status: 'authenticated',
    session: { user: { id: 'guest-a', emailVerified: true } },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => mocks.router,
  usePathname: () => '/profile/saved/return',
}));
vi.mock('@c1rcle/auth', () => ({
  useSessionStore: Object.assign(() => mocks.session, { getState: () => mocks.session }),
}));
vi.mock('@/features/onboarding/client', () => ({ readOnboarding: mocks.read }));
beforeEach(() => {
  mocks.router.replace.mockReset();
  mocks.read.mockReset();
  mocks.session.session.user.emailVerified = true;
  mocks.session.hydrated = true;
  mocks.session.status = 'authenticated';
  window.history.replaceState(null, '', '/profile/saved/return?event=%2Fevent%2Fnight-a');
});
it('waits for the existing onboarding guard before returning a completed Guest to the event', async () => {
  mocks.read.mockResolvedValue({ complete: true });
  render(
    <OnboardingGuard>
      <SavedEventReturn destination="/event/night-a" />
    </OnboardingGuard>,
  );
  await waitFor(() => {
    expect(mocks.router.replace).toHaveBeenCalledWith('/event/night-a');
  });
});
it('resumes incomplete onboarding without mounting the event return', async () => {
  mocks.read.mockResolvedValue({ complete: false });
  render(
    <OnboardingGuard>
      <SavedEventReturn destination="/event/night-a" />
    </OnboardingGuard>,
  );
  await waitFor(() => {
    expect(mocks.router.replace).toHaveBeenCalled();
  });
  expect(mocks.router.replace.mock.calls[0]?.[0]).toMatch(/^\/onboarding\?next=/);
  expect(mocks.router.replace).not.toHaveBeenCalledWith('/event/night-a');
});
it('resumes email verification before onboarding or event return', async () => {
  mocks.session.session.user.emailVerified = false;
  render(
    <OnboardingGuard>
      <SavedEventReturn destination="/event/night-a" />
    </OnboardingGuard>,
  );
  await waitFor(() => {
    expect(mocks.router.replace).toHaveBeenCalled();
  });
  expect(mocks.router.replace.mock.calls[0]?.[0]).toMatch(/^\/verify-email\?next=/);
  expect(mocks.read).not.toHaveBeenCalled();
  expect(mocks.router.replace).not.toHaveBeenCalledWith('/event/night-a');
});

it('does not redirect during anonymous bootstrap before protected-route setup checks', async () => {
  mocks.session.hydrated = false;
  mocks.session.status = 'anonymous';
  mocks.read.mockResolvedValue({ complete: false });
  const view = render(
    <OnboardingGuard>
      <SavedEventReturn destination="/event/night-a" />
    </OnboardingGuard>,
  );
  expect(mocks.router.replace).not.toHaveBeenCalled();
  mocks.session.hydrated = true;
  mocks.session.status = 'authenticated';
  view.rerender(
    <OnboardingGuard>
      <SavedEventReturn destination="/event/night-a" />
    </OnboardingGuard>,
  );
  await waitFor(() => {
    expect(mocks.router.replace).toHaveBeenCalled();
  });
  expect(mocks.router.replace.mock.calls[0]?.[0]).toMatch(/^\/onboarding\?next=/);
  expect(mocks.router.replace).not.toHaveBeenCalledWith('/event/night-a');
});
