import { describe, expect, it } from 'vitest';

import { venueNotifications } from './venue-notifications-model';

describe('venue notification destinations', () => {
  it('points tab notifications at the existing Venue routes', () => {
    expect(venueNotifications.find((item) => item.id === 'campaign-scheduled')?.destination).toBe(
      '/venue/marketing?tab=history',
    );
    expect(venueNotifications.find((item) => item.id === 'staff-access')?.destination).toBe(
      '/venue/settings?tab=team',
    );
  });
});
