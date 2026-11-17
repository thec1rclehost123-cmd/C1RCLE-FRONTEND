import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireGuestSession } from '@/lib/auth/require-session';
import { forwardToGateway } from '@/lib/bff/auth-proxy';

import ContinueGuest from './page';

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ toString: () => 'better-auth.session_token=synthetic' }),
}));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock('@/lib/auth/require-session', () => ({ requireGuestSession: vi.fn() }));
vi.mock('@/lib/bff/auth-proxy', () => ({ forwardToGateway: vi.fn() }));
const state = {
  displayName: 'Guest',
  dateOfBirth: '2000-01-01',
  tastes: ['House'],
  phoneNumber: '+919876543210',
  phoneVerified: true,
  complete: true,
  interestOptions: ['House'],
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireGuestSession).mockResolvedValue({ user: { emailVerified: true } } as never);
});
describe('post-auth onboarding continuation', () => {
  it.each([true, false])('routes from authoritative complete=%s', async (complete) => {
    vi.mocked(forwardToGateway).mockResolvedValue(
      new Response(JSON.stringify({ ...state, complete })),
    );
    await expect(
      ContinueGuest({ searchParams: Promise.resolve({ next: '/checkout' }) }),
    ).rejects.toThrow(complete ? 'REDIRECT:/checkout' : 'REDIRECT:/onboarding?next=%2Fcheckout');
  });
  it('requires email verification before profile completion checks', async () => {
    vi.mocked(requireGuestSession).mockResolvedValue({ user: { emailVerified: false } } as never);
    await expect(
      ContinueGuest({ searchParams: Promise.resolve({ next: '/checkout' }) }),
    ).rejects.toThrow('REDIRECT:/verify-email');
    expect(forwardToGateway).not.toHaveBeenCalled();
  });
  it('sanitizes external destinations and sends Guests to retry onboarding when status is unavailable', async () => {
    vi.mocked(forwardToGateway).mockRejectedValue(new Error('offline'));
    await expect(
      ContinueGuest({ searchParams: Promise.resolve({ next: 'https://attacker.example' }) }),
    ).rejects.toThrow('REDIRECT:/onboarding?next=%2Fexplore');
  });
  it('returns completed Guests to the original checkout query without repeating onboarding', async () => {
    vi.mocked(forwardToGateway).mockResolvedValue(new Response(JSON.stringify(state)));
    await expect(
      ContinueGuest({
        searchParams: Promise.resolve({
          next: '/checkout?eventId=fixture-event&tierId=fixture-tier',
        }),
      }),
    ).rejects.toThrow('REDIRECT:/checkout?eventId=fixture-event&tierId=fixture-tier');
  });

  it('requires email verification before returning to public discovery', async () => {
    vi.mocked(requireGuestSession).mockResolvedValue({ user: { emailVerified: false } } as never);
    await expect(
      ContinueGuest({ searchParams: Promise.resolve({ next: '/explore?genre=house' }) }),
    ).rejects.toThrow('REDIRECT:/verify-email?next=%2Fexplore%3Fgenre%3Dhouse');
    expect(forwardToGateway).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'checks onboarding for public destination when complete=%s',
    async (complete) => {
      vi.mocked(forwardToGateway).mockResolvedValue(
        new Response(JSON.stringify({ ...state, complete })),
      );
      await expect(
        ContinueGuest({ searchParams: Promise.resolve({ next: '/explore?genre=house' }) }),
      ).rejects.toThrow(
        complete
          ? 'REDIRECT:/explore?genre=house'
          : 'REDIRECT:/onboarding?next=%2Fexplore%3Fgenre%3Dhouse',
      );
    },
  );

  it('does not bypass required protected onboarding when its state is unavailable', async () => {
    vi.mocked(forwardToGateway).mockRejectedValue(new Error('offline'));
    await expect(
      ContinueGuest({ searchParams: Promise.resolve({ next: '/checkout?eventId=fixture' }) }),
    ).rejects.toThrow('REDIRECT:/onboarding?next=%2Fcheckout%3FeventId%3Dfixture');
  });
});
