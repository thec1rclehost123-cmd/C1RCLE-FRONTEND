import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PersonalProfileFormClient } from './PersonalProfileFormClient';

import type { ProfileIdentity } from '../types/profile.types';
import type { UpsertGuestProfileRequest } from '@c1rcle/contracts';

const mocks = vi.hoisted(() => ({
  put: vi.fn<(options: unknown) => Promise<unknown>>(),
  refresh: vi.fn<() => void>(),
}));

vi.mock('@c1rcle/api-client', () => ({
  createApiClient: () => ({ put: mocks.put }),
  isApiClientError: () => false,
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/lib/bff/csrf', () => ({ csrfHeaders: () => ({ 'x-csrf-token': 'test-token' }) }));

const IDENTITY: ProfileIdentity = {
  id: 'guest_1',
  displayName: 'M3 E2E Guest',
  initials: 'MG',
  email: 'guest@example.invalid',
  phoneNumber: null,
  city: 'Pune',
  instagram: null,
  gender: null,
  memberSince: null,
  badges: ['Member'],
  signInMethod: 'Email',
};

const RETAINED_FIELDS: Pick<UpsertGuestProfileRequest, 'dateOfBirth' | 'tastes' | 'intents'> = {
  dateOfBirth: '1990-01-01',
  tastes: ['Music', 'Art', 'Food'],
  intents: ['Discover'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PersonalProfileFormClient', () => {
  it('persists supported fields while preserving required profile fields', async () => {
    mocks.put.mockResolvedValue({
      ...RETAINED_FIELDS,
      displayName: 'M3 Guest Updated',
      city: 'Mumbai',
    });
    render(<PersonalProfileFormClient identity={IDENTITY} profileFields={RETAINED_FIELDS} />);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'M3 Guest Updated' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Mumbai' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mocks.put).toHaveBeenCalledOnce();
    });
    expect(mocks.put).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/profile/me',
        headers: { 'x-csrf-token': 'test-token' },
        body: {
          ...RETAINED_FIELDS,
          displayName: 'M3 Guest Updated',
          city: 'Mumbai',
        },
      }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Profile updated.');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('validates name and city without sending a write', () => {
    render(<PersonalProfileFormClient identity={IDENTITY} profileFields={RETAINED_FIELDS} />);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: ' ' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: ' ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Enter at least two characters.')).toBeInTheDocument();
    expect(screen.getByText('Enter a city.')).toBeInTheDocument();
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it('offers a retry after a save failure and resets only unsaved changes', async () => {
    mocks.put.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({
      ...RETAINED_FIELDS,
      displayName: 'M3 Guest Updated',
      city: 'Pune',
    });
    render(<PersonalProfileFormClient identity={IDENTITY} profileFields={RETAINED_FIELDS} />);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'M3 Guest Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('Check your connection and try again.');

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('status');
    expect(mocks.put).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText('Full name')).toHaveValue('M3 Guest Updated');
  });
});
