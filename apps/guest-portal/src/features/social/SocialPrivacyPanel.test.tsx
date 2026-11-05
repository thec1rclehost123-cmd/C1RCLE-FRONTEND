import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { SocialPrivacyPanel } from './SocialPrivacyPanel';

const client = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
vi.mock('./social-client', () => ({ socialClient: client }));
vi.mock('@/lib/bff/csrf', () => ({ csrfHeaders: () => ({ 'x-csrf-token': 'synthetic' }) }));
const state = {
  profileVisible: true,
  showOnGuestlists: true,
  showUpcomingEvents: true,
  blockedUsers: [{ id: 'guest-b', displayName: 'Synthetic Guest B' }],
  hiddenEvents: [],
};
beforeEach(() => {
  client.get.mockReset().mockResolvedValue(state);
  client.put.mockReset().mockResolvedValue(state);
});
it('keeps the three approved controls and saves only their original privacy values', async () => {
  render(<SocialPrivacyPanel />);
  const profile = await screen.findByRole('checkbox', { name: 'Show my social profile' });
  expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  fireEvent.click(profile);
  expect(screen.getByRole('checkbox', { name: 'Show me on event guestlists' })).toBeDisabled();
  expect(
    screen.getByRole('checkbox', { name: 'Show upcoming events on my profile' }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save privacy settings' }));
  await waitFor(() => {
    expect(client.put).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/social/privacy',
        body: { profileVisible: false, showOnGuestlists: true, showUpcomingEvents: true },
      }),
    );
  });
  expect(await screen.findByText('Privacy settings saved.')).toBeInTheDocument();
});
it('shows a clean blocked row with working Unblock and no permanent report action', async () => {
  render(<SocialPrivacyPanel />);
  expect(await screen.findByText('Synthetic Guest B')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Report Guest' })).not.toBeInTheDocument();
  client.get.mockResolvedValue({ ...state, blockedUsers: [] });
  client.put.mockResolvedValue(null);
  fireEvent.click(screen.getByRole('button', { name: 'Unblock' }));
  expect(await screen.findByText('No blocked guests.')).toBeInTheDocument();
  expect(client.put).toHaveBeenCalledWith(
    expect.objectContaining({ path: '/api/social/blocks/guest-b', body: { blocked: false } }),
  );
});
