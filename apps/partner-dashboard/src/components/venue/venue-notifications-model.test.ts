import { describe, expect, it } from 'vitest';

import { venueNotifications } from './venue-notifications-model';

const venueRoutes = new Set([
  '/venue/events/neon-nights-afrobeats',
  '/venue/finance',
  '/venue/marketing',
  '/venue/settings',
  '/venue/slot-requests',
]);

describe('venue notification destinations', () => {
  it('only links to live Venue routes', () => {
    expect(venueNotifications.map((notification) => notification.destination)).toEqual([
      '/venue/slot-requests',
      '/venue/finance',
      '/venue/events/neon-nights-afrobeats',
      '/venue/marketing',
      '/venue/settings',
    ]);
    expect(
      venueNotifications.every(
        (notification) =>
          notification.destination === null || venueRoutes.has(notification.destination),
      ),
    ).toBe(true);
  });
});
