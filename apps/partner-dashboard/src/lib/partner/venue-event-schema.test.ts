import { describe, expect, it } from 'vitest';

import { venueEventDraftSchema } from './venue-event-schema';

const validDraft = {
  name: 'Rooftop Jazz',
  venueId: 'skyline-social',
  eventDate: '2099-09-18',
  startTime: '19:30',
  endTime: '23:30',
  timezone: 'Asia/Kolkata' as const,
  capacity: 260,
  ticketTiers: [{ name: 'General admission', pricePaise: 80000, inventory: 260, saleStartsAt: '2099-08-01T00:00:00.000Z', saleEndsAt: '2099-09-18T12:00:00.000Z' }],
};

describe('venueEventDraftSchema', () => {
  it('accepts a valid future event', () => { expect(venueEventDraftSchema.safeParse(validDraft).success).toBe(true); });
  it('rejects an end time before the start time', () => { expect(venueEventDraftSchema.safeParse({ ...validDraft, endTime: '18:00' }).success).toBe(false); });
  it('rejects ticket inventory above capacity', () => { expect(venueEventDraftSchema.safeParse({ ...validDraft, capacity: 100 }).success).toBe(false); });
  it('rejects ticket sales ending after the event starts', () => { expect(venueEventDraftSchema.safeParse({ ...validDraft, ticketTiers: [{ ...validDraft.ticketTiers[0], saleEndsAt: '2099-09-18T22:00:00.000Z' }] }).success).toBe(false); });
});
