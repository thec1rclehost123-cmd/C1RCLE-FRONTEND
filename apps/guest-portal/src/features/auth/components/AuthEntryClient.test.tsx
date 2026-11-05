import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthEntryClient } from './AuthEntryClient';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/app/login/login-page-client', () => ({
  LoginPageClient: ({ suggestedEmail }: { suggestedEmail: string }) => (
    <p>Sign in for {suggestedEmail}</p>
  ),
}));
vi.mock('@/app/signup/signup-client', () => ({
  SignupClient: ({ suggestedEmail }: { suggestedEmail: string }) => (
    <p>Create account for {suggestedEmail}</p>
  ),
}));
vi.mock('./GoogleButton', () => ({ GoogleButton: () => <button>Continue with Google</button> }));
describe('email-first auth entry', () => {
  it.each(['known@example.invalid', 'new@example.invalid'])(
    'offers identical explicit choices for %s without account discovery',
    (email) => {
      const fetch = vi.spyOn(globalThis, 'fetch');
      render(<AuthEntryClient />);
      expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } });
      fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
      expect(screen.getByText(`Create account for ${email}`)).toBeInTheDocument();
      fetch.mockRestore();
    },
  );
});
