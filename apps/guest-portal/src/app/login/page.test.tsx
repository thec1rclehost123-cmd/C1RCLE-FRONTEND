import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { loginFixture } from '../../features/auth/fixtures/login.fixture';

import { isValidFixtureOtp, LoginPageClient } from './login-page-client';

describe('LoginPage', () => {
  it('renders headline typography from fixture', () => {
    render(<LoginPageClient />);
    expect(screen.getByText(/GET IN/i)).toBeInTheDocument();
    expect(screen.getAllByText(/C1RCLE/i).length).toBeGreaterThan(0);
    expect(screen.getByText(loginFixture.hero.tagline)).toBeInTheDocument();
  });

  it('renders initial credentials step with email and password inputs', () => {
    render(<LoginPageClient />);
    expect(screen.getByText(/No authentication/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('NAME@EMAIL.COM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CONTINUE WITH GOOGLE/i })).toBeInTheDocument();
  });

  it('validates email and password input submission when values are provided', () => {
    vi.useFakeTimers();
    render(<LoginPageClient />);
    const emailInput = screen.getByPlaceholderText('NAME@EMAIL.COM');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const form = emailInput.closest('form')!;

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/No session created/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('toggles mode between login and signup', () => {
    render(<LoginPageClient />);
    const toggleBtn = screen.getByRole('button', { name: /CREATE ACCOUNT/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/JOIN THE/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /LOG IN/i })).toBeInTheDocument();
  });

  it('verifies fixture isolation with no backend imports', () => {
    expect(loginFixture).toBeDefined();
    expect(loginFixture.defaultOtp).toBe('123456');
    expect(loginFixture.availableCities).toContain('Mumbai');
  });

  it('rejects every OTP except the exact six-digit fixture OTP', () => {
    expect(isValidFixtureOtp('123456')).toBe(true);
    expect(isValidFixtureOtp('654321')).toBe(false);
    expect(isValidFixtureOtp('12345')).toBe(false);
    expect(isValidFixtureOtp('1234567')).toBe(false);
  });
});
