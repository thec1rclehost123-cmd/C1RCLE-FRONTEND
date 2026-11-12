import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readOnboarding, saveOnboarding, verifyOnboardingPhone } from './client';
import { OnboardingClient } from './OnboardingClient';
import { confirmPhoneCode, requestPhoneCode } from './phone';

const { replace, router, intent } = vi.hoisted(() => {
  const replace = vi.fn();
  return { replace, router: { replace, refresh: vi.fn() }, intent: { next: '/explore' } };
});
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams({ next: intent.next }),
}));
vi.mock('./client', () => ({
  readOnboarding: vi.fn(),
  saveOnboarding: vi.fn(),
  verifyOnboardingPhone: vi.fn(),
}));
vi.mock('./phone', () => ({
  clearPhoneChallenge: vi.fn(),
  requestPhoneCode: vi.fn(),
  confirmPhoneCode: vi.fn(),
  phoneAuthErrorMessage: (_error: unknown, phase: 'send' | 'verify') =>
    phase === 'send'
      ? 'A code could not be sent. Please try again later.'
      : 'Verification failed. Check the code, or request a new one.',
}));
const saved = {
  displayName: 'Google Name',
  dateOfBirth: '',
  tastes: [],
  phoneNumber: null,
  phoneVerified: false,
  complete: false,
  interestOptions: ['House', 'Techno'],
};
beforeEach(() => {
  vi.resetAllMocks();
  intent.next = '/explore';
});
describe('Guest onboarding', () => {
  it('resumes at DOB after persisted name, without restarting signup', async () => {
    vi.mocked(readOnboarding).mockResolvedValue(saved);
    render(<OnboardingClient initialName="Google Name" />);
    expect(await screen.findByLabelText('Date of birth')).toBeInTheDocument();
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument();
  });
  it('prefills provider name and saves before advancing', async () => {
    vi.mocked(readOnboarding)
      .mockResolvedValueOnce({ ...saved, displayName: '' })
      .mockResolvedValueOnce(saved);
    render(<OnboardingClient initialName="Google Name" />);
    expect(await screen.findByLabelText('Your name')).toHaveValue('Google Name');
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Edited Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('Date of birth');
    expect(saveOnboarding).toHaveBeenCalledWith({ displayName: 'Edited Name' });
  });
  it('bypasses completed onboarding and keeps a trusted destination', async () => {
    vi.mocked(readOnboarding).mockResolvedValue({ ...saved, complete: true });
    render(<OnboardingClient initialName="Guest" />);
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/explore');
    });
  });
  it('returns to the original checkout and tier only after persisted completion', async () => {
    intent.next = '/checkout/original-event?tier=general&ref=trusted';
    vi.mocked(readOnboarding)
      .mockResolvedValueOnce({
        ...saved,
        dateOfBirth: '2000-01-01',
        phoneNumber: '+919876543210',
        phoneVerified: true,
      })
      .mockResolvedValueOnce({ ...saved, complete: true, tastes: ['House'] });
    render(<OnboardingClient initialName="Guest" />);
    fireEvent.click(await screen.findByRole('button', { name: 'House' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(intent.next);
    });
    expect(saveOnboarding).toHaveBeenCalledWith({ tastes: ['House'] });
  });
  it('does not return to checkout when persisted completion is still false', async () => {
    intent.next = '/checkout/original-event?tier=general';
    vi.mocked(readOnboarding).mockResolvedValue({
      ...saved,
      dateOfBirth: '2000-01-01',
      phoneNumber: '+919876543210',
      phoneVerified: true,
    });
    render(<OnboardingClient initialName="Guest" />);
    fireEvent.click(await screen.findByRole('button', { name: 'House' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be saved');
    expect(replace).not.toHaveBeenCalled();
  });
  it.each(['wrong-code', 'expired-code'])(
    'does not persist a verified phone after %s',
    async (reason) => {
      vi.mocked(readOnboarding).mockResolvedValue({ ...saved, dateOfBirth: '2000-01-01' });
      vi.mocked(requestPhoneCode).mockResolvedValue({} as never);
      vi.mocked(confirmPhoneCode).mockRejectedValue(new Error(reason));
      render(<OnboardingClient initialName="Guest" />);
      fireEvent.change(await screen.findByLabelText('Phone number'), {
        target: { value: '+919876543210' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
      fireEvent.change(await screen.findByLabelText('Verification code'), {
        target: { value: '000000' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Verification failed');
      expect(verifyOnboardingPhone).not.toHaveBeenCalled();
    },
  );
  it('verifies the exact requested phone before advancing and enforces resend cooldown', async () => {
    vi.mocked(readOnboarding)
      .mockResolvedValueOnce({ ...saved, dateOfBirth: '2000-01-01' })
      .mockResolvedValueOnce({
        ...saved,
        dateOfBirth: '2000-01-01',
        phoneNumber: '+919876543210',
        phoneVerified: true,
      });
    vi.mocked(requestPhoneCode).mockResolvedValue({} as never);
    vi.mocked(confirmPhoneCode).mockResolvedValue('synthetic-proof');
    render(<OnboardingClient initialName="Guest" />);
    fireEvent.change(await screen.findByLabelText('Phone number'), {
      target: { value: '+919876543210' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
    const input = await screen.findByLabelText('Verification code');
    const resend = screen.getByRole('button', { name: /Resend in/ });
    expect(resend).toBeDisabled();
    fireEvent.click(resend);
    expect(requestPhoneCode).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Choose at least one.')).toBeInTheDocument();
    expect(verifyOnboardingPhone).toHaveBeenCalledWith('+919876543210', 'synthetic-proof');
  });
  it('keeps send failure recoverable without claiming phone verification', async () => {
    vi.mocked(readOnboarding).mockResolvedValue({ ...saved, dateOfBirth: '2000-01-01' });
    vi.mocked(requestPhoneCode).mockRejectedValue(new Error('rate-limit-or-network'));
    render(<OnboardingClient initialName="Guest" />);
    fireEvent.change(await screen.findByLabelText('Phone number'), {
      target: { value: '+919876543210' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('A code could not be sent');
    expect(screen.getByRole('button', { name: 'Send code' })).toBeEnabled();
    expect(verifyOnboardingPhone).not.toHaveBeenCalled();
  });
});
