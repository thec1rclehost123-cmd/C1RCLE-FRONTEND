import { describe, expect, it } from 'vitest';

import { isEventDetailTabActive } from './EventDetailLayout';
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

describe('query-driven event detail tabs', () => {
  const pathname = '/promoter/events/neon-nights';

  it.each(['summary', 'performance', 'orders', 'links', 'commission'])(
    'selects the %s tab from URL state',
    (id) => {
      expect(
        isEventDetailTabActive(pathname, id, {
          id,
          label: id,
          href: `${pathname}?tab=${id}`,
        }),
      ).toBe(true);
    },
  );

  it('does not select a different query tab', () => {
    expect(
      isEventDetailTabActive(pathname, 'orders', {
        id: 'performance',
        label: 'Performance',
        href: `${pathname}?tab=performance`,
      }),
    ).toBe(false);
  });
});
