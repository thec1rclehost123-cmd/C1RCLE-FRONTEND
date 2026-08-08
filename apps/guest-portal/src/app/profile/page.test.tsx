import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@c1rcle/auth';

import { ProfileLoggedOutView } from '@/features/profile/components/ProfileLoggedOutView';

import ProfilePage from './page';

vi.mock('next/image', () => ({
  default: ({ alt, fill: _fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    replace.mockClear();
    useSessionStore.getState().clearSession();
  });

  it('renders the fixture owner overview without fake authentication controls', async () => {
    render(await ProfilePage());

    expect(screen.getByRole('heading', { level: 1, name: 'Riya Kapoor' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Profile sections' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your C1RCLE at a glance' })).toBeInTheDocument();
    expect(screen.queryByText(/UI PREVIEW|FIXTURE DATA/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /logged in|guest showcase/i }),
    ).not.toBeInTheDocument();
  });

  it('renders upcoming and attended event views from explicit query state', async () => {
    const { rerender } = render(
      await ProfilePage({ searchParams: Promise.resolve({ view: 'events' }) }),
    );

    expect(screen.getByRole('heading', { name: 'Rooftop Jazz' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Art Collective' })).toBeInTheDocument();

    rerender(
      await ProfilePage({
        searchParams: Promise.resolve({ filter: 'attended', view: 'events' }),
      }),
    );
    expect(screen.getByRole('heading', { name: 'Neon Nights' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rooftop Jazz' })).not.toBeInTheDocument();
  });

  it('supports local personal-setting validation and reset without claiming persistence', async () => {
    render(
      await ProfilePage({
        searchParams: Promise.resolve({ section: 'personal', view: 'settings' }),
      }),
    );

    const nameInput = screen.getByLabelText('Full name');
    fireEvent.change(nameInput, { target: { value: 'R' } });
    fireEvent.blur(nameInput);
    expect(screen.getByText('Enter at least two characters.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset changes' }));
    expect(nameInput).toHaveValue('Riya Kapoor');
    expect(screen.queryByText('Enter at least two characters.')).not.toBeInTheDocument();
    expect(screen.queryByText(/saved successfully/i)).not.toBeInTheDocument();
  });

  it('clears the local session and returns to login after sign-out confirmation', async () => {
    useSessionStore.setState({ accessToken: 'fixture-access-token', status: 'authenticated' });
    render(
      await ProfilePage({
        searchParams: Promise.resolve({ section: 'account', view: 'settings' }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByRole('dialog', { name: 'End this session?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm sign out' }));

    expect(useSessionStore.getState().status).toBe('anonymous');
    expect(replace).toHaveBeenCalledWith('/login?next=/profile');
  });

  it('provides a pure logged-out view with a safe return target', () => {
    render(<ProfileLoggedOutView />);

    expect(screen.getByRole('link', { name: 'Continue to login' })).toHaveAttribute(
      'href',
      '/login?next=/profile',
    );
  });
});
