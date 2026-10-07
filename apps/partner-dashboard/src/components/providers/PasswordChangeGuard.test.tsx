import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PasswordChangeGuard } from './PasswordChangeGuard';

const mocks = vi.hoisted(() => ({
  status: 'authenticated',
  hydrated: true,
  mustChangePassword: true,
  pathname: '/partner/venue/partners',
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@c1rcle/auth', () => ({
  useSessionStore: () => ({
    status: mocks.status,
    hydrated: mocks.hydrated,
    session:
      mocks.status === 'authenticated'
        ? {
            user: {
              id: 'u1',
              email: 'staff@example.com',
              displayName: 'Staff',
              role: 'partner',
              avatarUrl: null,
              mustChangePassword: mocks.mustChangePassword,
            },
          }
        : null,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.status = 'authenticated';
  mocks.hydrated = true;
  mocks.mustChangePassword = true;
  mocks.pathname = '/partner/venue/partners';
});

describe('PasswordChangeGuard', () => {
  it('redirects flagged accounts to change-password with the destination preserved', async () => {
    render(
      <PasswordChangeGuard>
        <p>dashboard</p>
      </PasswordChangeGuard>,
    );

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        '/change-password?next=%2Fpartner%2Fvenue%2Fpartners',
      );
    });
  });

  it('leaves clean accounts alone', () => {
    mocks.mustChangePassword = false;
    render(
      <PasswordChangeGuard>
        <p>dashboard</p>
      </PasswordChangeGuard>,
    );

    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('does not redirect on exempt routes', () => {
    mocks.pathname = '/change-password';
    render(
      <PasswordChangeGuard>
        <p>rotation form</p>
      </PasswordChangeGuard>,
    );

    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
