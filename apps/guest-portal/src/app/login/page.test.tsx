import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { login, signup } from '@c1rcle/auth';
import { guestProfileDtoSchema } from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

import { loginFixture } from '../../features/auth/fixtures/login.fixture';

import { isValidFixtureOtp, LoginPageClient } from './login-page-client';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: { put: vi.fn() },
}));

function completeSignupCredentials() {
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'new@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'longenough1' } });
  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
  fireEvent.change(screen.getByLabelText(/enter verification code/i), {
    target: { value: '123456' },
  });
  fireEvent.click(screen.getByRole('button', { name: /verify & continue/i }));
}

describe('LoginPage', () => {
  it('renders the email and password login form without third-party providers', () => {
    render(<LoginPageClient />);

    expect(screen.getByText(/GET IN/i)).toBeInTheDocument();
    expect(screen.getByText(loginFixture.hero.tagline)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue with apple/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /continue with phone number/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/mobile number/i)).not.toBeInTheDocument();
  });

  it('logs in directly with email and password, no verification code', async () => {
    vi.mocked(login).mockResolvedValue(undefined);
    render(<LoginPageClient />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'guest@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'guest@example.com',
        password: 'password123',
      });
    });
    expect(screen.queryByLabelText(/enter verification code/i)).not.toBeInTheDocument();
  });

  it('signs up through onboarding and enforces the backend password minimum', async () => {
    vi.mocked(signup).mockResolvedValue(undefined);
    vi.mocked(apiClient.put).mockResolvedValue({
      userId: 'user_1',
      displayName: 'Aayush',
      dateOfBirth: '2000-01-01',
      city: 'Mumbai',
      tastes: ['Rooftops', 'Live music', 'Art & culture'],
      intents: ['Find events'],
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<LoginPageClient initialMode="signup" />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i);
    expect(signup).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
    fireEvent.change(screen.getByLabelText(/enter verification code/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify & continue/i }));

    // Identity: preferred name + 18+ check.
    expect(screen.getByRole('heading', { name: /what should we call you/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/what we should call you/i);

    fireEvent.change(screen.getByLabelText(/preferred name/i), { target: { value: 'Aayush' } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: '2015-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 18 years old/i);

    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: '2000-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    // City.
    expect(screen.getByRole('heading', { name: /where are you going out/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mumbai' }));
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    // Tastes: at least three.
    expect(screen.getByRole('heading', { name: /what kind of nights/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least three/i);

    fireEvent.click(screen.getByRole('button', { name: 'Rooftops' }));
    fireEvent.click(screen.getByRole('button', { name: 'Live music' }));
    fireEvent.click(screen.getByRole('button', { name: 'Art & culture' }));
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    // Intent: at least one, then the backend account is created.
    expect(screen.getByRole('heading', { name: /what brings you here/i })).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Find events' }));
    fireEvent.click(screen.getByRole('button', { name: /^finish$/i }));

    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'longenough1',
        displayName: 'Aayush',
      });
    });
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith({
        path: '/api/v2/profile/me',
        body: {
          displayName: 'Aayush',
          dateOfBirth: '2000-01-01',
          city: 'Mumbai',
          tastes: ['Rooftops', 'Live music', 'Art & culture'],
          intents: ['Find events'],
        },
        schema: guestProfileDtoSchema,
      });
    });
    expect(signup).toHaveBeenCalledTimes(1);
  });

  it('walks the restored onboarding steps after the demo code', () => {
    vi.mocked(signup).mockResolvedValue(undefined);
    render(<LoginPageClient initialMode="signup" />);
    completeSignupCredentials();

    expect(screen.getByRole('heading', { name: /what should we call you/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });

  it('toggles between login and signup modes inside the form', () => {
    render(<LoginPageClient initialMode="login" />);

    expect(screen.queryByPlaceholderText(/min. 8 characters/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /create an account/i }));
    expect(screen.getByPlaceholderText(/min. 8 characters/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.queryByPlaceholderText(/min. 8 characters/i)).not.toBeInTheDocument();
  });

  it('keeps the demo OTP fixed at 123456', () => {
    expect(loginFixture.defaultOtp).toBe('123456');
    expect(isValidFixtureOtp('123456')).toBe(true);
    expect(isValidFixtureOtp('654321')).toBe(false);
    expect(isValidFixtureOtp('12345')).toBe(false);
    expect(isValidFixtureOtp('1234567')).toBe(false);
  });
});
