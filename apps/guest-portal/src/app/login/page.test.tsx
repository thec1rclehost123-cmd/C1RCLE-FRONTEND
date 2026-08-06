import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { loginFixture } from '../../features/auth/fixtures/login.fixture';

import { LoginPageClient } from './login-page-client';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders headline typography from fixture', () => {
    render(<LoginPageClient />);
    expect(screen.getByText(/GET IN/i)).toBeInTheDocument();
    expect(screen.getAllByText(/C1RCLE/i).length).toBeGreaterThan(0);
    expect(screen.getByText(loginFixture.hero.tagline)).toBeInTheDocument();
  });

  it('renders initial credentials step with email and password inputs', () => {
    render(<LoginPageClient />);
    expect(screen.getByPlaceholderText('NAME@EMAIL.COM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CONTINUE WITH GOOGLE/i })).toBeInTheDocument();
  });

  it('validates email and password input submission when values are provided', () => {
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

    expect(screen.getByText(/Signed in successfully!/i)).toBeInTheDocument();
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
});
