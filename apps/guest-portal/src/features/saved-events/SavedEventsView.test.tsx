import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { SavedEventsView } from './SavedEventsView';

const mocks = vi.hoisted(() => ({ put: vi.fn(), get: vi.fn() }));
vi.mock('./client', () => ({ savedClient: mocks }));
vi.mock('@/lib/bff/csrf', () => ({ csrfHeaders: () => ({ 'x-csrf-token': 'synthetic' }) }));
const page = {
  items: [
    {
      eventId: 'event-a',
      savedAt: '2026-11-04T00:00:00Z',
      event: {
        id: 'event-a',
        slug: 'night-a',
        title: 'Synthetic Night',
        startAt: '2099-12-01T18:00:00Z',
        status: 'published' as const,
        imageUrl: null,
      },
    },
  ],
  nextCursor: null,
};
beforeEach(() => {
  mocks.put.mockReset();
  mocks.get.mockReset();
});
it('retains the row on failed Unsave and removes it only after confirmed success', async () => {
  render(<SavedEventsView initial={page} />);
  mocks.put.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Unsave' }));
  expect(await screen.findByText(/could not be removed/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Synthetic Night/ })).toHaveAttribute(
    'href',
    '/event/night-a',
  );
  mocks.put.mockResolvedValueOnce({ saved: false });
  fireEvent.click(screen.getByRole('button', { name: 'Unsave' }));
  expect(await screen.findByText('No saved events yet.')).toBeInTheDocument();
});
it('shows no copied event details when the canonical event becomes inaccessible', () => {
  render(
    <SavedEventsView
      initial={{
        items: [{ eventId: 'event-a', savedAt: page.items[0]!.savedAt, event: null }],
        nextCursor: null,
      }}
    />,
  );
  expect(screen.getByText('Event unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Synthetic Night')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Unsave' })).toBeInTheDocument();
});
