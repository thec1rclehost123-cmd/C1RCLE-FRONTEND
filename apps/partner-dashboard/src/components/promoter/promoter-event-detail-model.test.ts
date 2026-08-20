import { describe, expect, it } from 'vitest';

import { fixturePromoterRepository } from '@/lib/partner/fixture-promoter-repository';

import {
  getPrimaryPromoterEventLink,
  getPromoterEventLinks,
  getPromoterEventOrders,
  getPromoterEventStatusLabel,
} from './promoter-event-detail-model';

describe('Promoter Event Detail data mapping', () => {
  it('uses the existing promoter link source for the permanent event link', async () => {
    const [links] = await Promise.all([fixturePromoterRepository.getLinks()]);

    expect(getPrimaryPromoterEventLink('neon-nights', links)).toMatchObject({
      id: 'lnk-instagram-neon',
      shortUrl: 'c1rcle.in/zoya/neon',
    });
    expect(getPrimaryPromoterEventLink('missing-event', links)).toBeNull();
  });

  it('derives channel data and orders from repository records', async () => {
    const [overview, links, events] = await Promise.all([
      fixturePromoterRepository.getOverview(),
      fixturePromoterRepository.getLinks(),
      fixturePromoterRepository.getLinkedEvents(),
    ]);
    const event = events[0];

    expect(event).toBeDefined();
    expect(getPromoterEventLinks(event!.id, links)).toHaveLength(2);
    expect(getPromoterEventOrders(event!, overview.recentOrders)).toEqual([
      expect.objectContaining({ id: 'order-4812', ticketCount: 2 }),
      expect.objectContaining({ id: 'order-4799', ticketCount: 1 }),
      expect.objectContaining({ id: 'order-4760', status: 'refunded' }),
    ]);
  });

  it('preserves repository event status semantics', () => {
    expect(getPromoterEventStatusLabel('active')).toBe('Active');
    expect(getPromoterEventStatusLabel('requested')).toBe('Requested');
    expect(getPromoterEventStatusLabel('completed')).toBe('Completed');
  });
});
