import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

import { SaveEventControl } from './SaveEventControl';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  push: vi.fn(),
  session: { hydrated: true, status: 'authenticated', session: { user: { id: 'guest-a' } } },
}));
vi.mock('@c1rcle/auth', () => ({ useSessionStore: () => mocks.session }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('./client', () => ({ savedClient: { get: mocks.get, put: mocks.put } }));
vi.mock('@/lib/bff/csrf', () => ({ csrfHeaders: () => ({ 'x-csrf-token': 'synthetic' }) }));
beforeEach(() => {
  mocks.get.mockReset().mockResolvedValue({ saved: false });
  mocks.put.mockReset();
  mocks.push.mockReset();
  mocks.session.status = 'authenticated';
  mocks.session.session.user.id = 'guest-a';
});
it('waits for confirmed writes and retains authoritative state on save and unsave failures', async () => {
  render(<SaveEventControl eventId="event-a" slug="night-a" />);
  await waitFor(() => {
    expect(mocks.get).toHaveBeenCalled();
  });
  mocks.put.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Save event' }));
  expect(await screen.findByText(/That change could not be saved/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save event' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  mocks.put.mockResolvedValueOnce({ saved: true });
  fireEvent.click(screen.getByRole('button', { name: 'Save event' }));
  expect(await screen.findByRole('button', { name: 'Unsave event' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  mocks.put.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Unsave event' }));
  expect(await screen.findByText(/That change could not be saved/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Unsave event' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
it('sends anonymous Save through the existing trusted event-return flow without writing', () => {
  mocks.session.status = 'anonymous';
  render(<SaveEventControl eventId="event-a" slug="night-a" />);
  fireEvent.click(screen.getByRole('button', { name: 'Save event' }));
  expect(mocks.push).toHaveBeenCalledWith('/auth/continue?next=%2Fevent%2Fnight-a');
  expect(mocks.put).not.toHaveBeenCalled();
});
it('does not reuse A’s saved state when the authenticated identity changes to B', async () => {
  mocks.get.mockResolvedValueOnce({ saved: true });
  const { rerender } = render(<SaveEventControl eventId="event-a" slug="night-a" />);
  expect(await screen.findByRole('button', { name: 'Unsave event' })).toBeInTheDocument();
  mocks.session.session.user.id = 'guest-b';
  mocks.get.mockResolvedValueOnce({ saved: false });
  rerender(<SaveEventControl eventId="event-a" slug="night-a" />);
  expect(await screen.findByRole('button', { name: 'Save event' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

it('keeps public browsing open when setup is incomplete and resumes only on Save', async () => {
  mocks.get.mockRejectedValueOnce(
    new ApiClientError({
      code: 'forbidden',
      message: 'Setup required',
      status: 403,
      requestId: undefined,
      fieldErrors: undefined,
    }),
  );
  render(<SaveEventControl eventId="event-a" slug="night-a" />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save event' })).toBeEnabled());
  expect(mocks.push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Save event' }));
  expect(mocks.push).toHaveBeenCalledWith('/auth/continue?next=%2Fevent%2Fnight-a');
  expect(mocks.put).not.toHaveBeenCalled();
});

it('does not carry a saved state from one event into another during navigation', async () => {
  mocks.get.mockResolvedValueOnce({ saved: true });
  const { rerender } = render(<SaveEventControl eventId="event-a" slug="night-a" />);
  expect(await screen.findByRole('button', { name: 'Unsave event' })).toBeInTheDocument();
  rerender(<SaveEventControl eventId="event-b" slug="night-b" />);
  expect(screen.getByRole('button', { name: 'Save event' })).toBeDisabled();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save event' })).toBeEnabled());
  expect(mocks.get).toHaveBeenLastCalledWith(
    expect.objectContaining({ path: '/api/saved-events/event-b' }),
  );
});
