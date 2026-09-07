import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { loginFixture } from '../../features/auth/fixtures/login.fixture';

import { isValidFixtureOtp, LoginPageClient } from './login-page-client';

describe('LoginPage', () => {
  it('renders the mobile-aligned provider choices without email and password fields', () => {
    render(<LoginPageClient />);

    expect(screen.getByText(/GET IN/i)).toBeInTheDocument();
    expect(screen.getByText(loginFixture.hero.tagline)).toBeInTheDocument();
    expect(screen.queryByText(/fixture data|ui preview|no authentication/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with apple/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with phone number/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it('moves Apple and Google choices into onboarding without success claims', () => {
    render(<LoginPageClient />);

    fireEvent.click(screen.getByRole('button', { name: /continue with apple/i }));
    expect(screen.getByRole('heading', { name: /what should we call you/i })).toBeInTheDocument();
    expect(screen.queryByText(/signed in|account created|ui preview|fixture/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /go back/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(screen.getByRole('heading', { name: /what should we call you/i })).toBeInTheDocument();
  });

  it('previews phone verification with an exact fixture OTP and no SMS claim', () => {
    render(<LoginPageClient />);

    fireEvent.click(screen.getByRole('button', { name: /continue with phone number/i }));
    fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /send demo code/i }));

    expect(screen.getByRole('heading', { name: /enter your code/i })).toBeInTheDocument();

    const otpInput = screen.getByLabelText(/enter verification code/i);
    fireEvent.change(otpInput, { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: /verify preview/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid verification code/i);

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify preview/i }));
    expect(screen.getByRole('heading', { name: /what should we call you/i })).toBeInTheDocument();
    expect(screen.queryByText(/session|fixture|ui preview/i)).not.toBeInTheDocument();
  });

  it('continues through the mobile-style identity and city onboarding', () => {
    render(<LoginPageClient />);

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    fireEvent.change(screen.getByLabelText(/preferred name/i), { target: { value: 'Aayush' } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2000-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    expect(screen.getByRole('heading', { name: /where are you going out/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mumbai' }));
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(screen.getByRole('heading', { name: /what kind of nights/i })).toBeInTheDocument();
  });

  it('keeps fixture OTP validation exact and isolated from backend code', () => {
    expect(loginFixture.defaultOtp).toBe('123456');
    expect(isValidFixtureOtp('123456')).toBe(true);
    expect(isValidFixtureOtp('654321')).toBe(false);
    expect(isValidFixtureOtp('12345')).toBe(false);
    expect(isValidFixtureOtp('1234567')).toBe(false);
  });
});
