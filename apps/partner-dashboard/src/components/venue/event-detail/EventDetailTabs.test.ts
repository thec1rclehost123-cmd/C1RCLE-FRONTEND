import { describe, expect, it } from 'vitest';

import { buildEventDetailTabDestinations } from './EventDetailTabs';

describe('buildEventDetailTabDestinations', () => {
  it('creates one route destination for each approved event task tab', () => {
    expect(buildEventDetailTabDestinations('neon-nights-afrobeats')).toEqual([
      { label: 'Summary', href: '/venue/events/neon-nights-afrobeats' },
      { label: 'Sales', href: '/venue/events/neon-nights-afrobeats/sales' },
      { label: 'Guests', href: '/venue/events/neon-nights-afrobeats/guests' },
      { label: 'Promoters', href: '/venue/events/neon-nights-afrobeats/promoters' },
      { label: 'Marketing', href: '/venue/events/neon-nights-afrobeats/marketing' },
      { label: 'Finance', href: '/venue/events/neon-nights-afrobeats/finance' },
    ]);
  });
});
