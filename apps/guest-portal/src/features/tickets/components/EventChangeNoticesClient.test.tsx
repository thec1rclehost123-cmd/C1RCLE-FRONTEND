import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventChangeNoticesClient } from './EventChangeNoticesClient';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/lib/bff/bff-client', () => ({ bffClient: { get, post } }));
vi.mock('@/lib/bff/csrf', () => ({ csrfHeaders: () => ({ 'x-csrf-token': 'csrf' }) }));

const notice = {
  id: 'notice_1',
  type: 'event.material_change' as const,
  title: 'Event details changed',
  body: 'Night One was updated. Review the current date, time and venue in your ticket wallet. This notice does not change your ticket or refund rights.',
  link: '/tickets',
  subjectId: 'EMC-version-2',
  createdAt: '2026-10-28T15:00:00.000Z',
  readAt: null,
  eventChange: {
    eventVersion: 2,
    entitlementId: 'ENT-ticket_1',
    canAccept: true,
    canRequestRefund: true,
  },
  eventChangeResponse: null,
};
let currentNotice = notice;

beforeEach(() => {
  currentNotice = notice;
  get.mockReset().mockImplementation(() =>
    Promise.resolve({
      items: [currentNotice],
      pageInfo: { limit: 20 },
      nextCursor: null,
    }),
  );
  post.mockReset().mockImplementation((request: { path: string; body?: { response?: string } }) => {
    if (request.path.endsWith('/read')) {
      currentNotice = { ...currentNotice, readAt: '2026-10-28T15:05:00.000Z' };
      return Promise.resolve({ updated: 1 });
    }
    currentNotice = {
      ...currentNotice,
      eventChangeResponse: {
        response: 'refund_requested',
        respondedAt: '2026-10-28T15:05:00.000Z',
      },
    };
    return Promise.resolve({
      entitlementId: 'ENT-ticket_1',
      eventVersion: 2,
      response: request.body?.response,
      respondedAt: '2026-10-28T15:05:00.000Z',
      replayed: false,
      refundCreated: false,
    });
  });
});

describe('EventChangeNoticesClient', () => {
  it('records that the notice was seen without presenting it as acceptance', async () => {
    render(<EventChangeNoticesClient />);

    expect(await screen.findByText(/does not create or issue a refund/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mark seen' }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/notifications/me/read',
          body: { ids: ['notice_1'] },
        }),
      );
      expect(screen.getByText('Seen')).toBeTruthy();
    });
  });

  it('records an explicit refund review request without representing it as a refund', async () => {
    render(<EventChangeNoticesClient />);

    fireEvent.click(await screen.findByRole('button', { name: 'Request refund review' }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/tickets/ENT-ticket_1/event-changes/2/respond',
          body: { response: 'refund_requested' },
        }),
      );
      expect(screen.getByText('Refund review requested. No refund has been issued.')).toBeTruthy();
    });
  });
});
