import { describe, expect, it } from 'vitest';

import {
  getHostPartner,
  hostAvailability,
  hostEvents,
  hostPartners,
  hostPayouts,
} from './host-studio-model';

describe('Host Studio normalized model', () => {
  it('keeps venues and promoters separate while sharing one relationship source', () => {
    expect(hostPartners.filter((partner) => partner.kind === 'venue')).not.toHaveLength(0);
    expect(hostPartners.filter((partner) => partner.kind === 'promoter')).not.toHaveLength(0);
    expect(getHostPartner('venue', 'karan-shah')).toBeNull();
  });

  it('only exposes venue-supplied slots for an active partnership', () => {
    const venue = getHostPartner('venue', hostAvailability.venueId);
    expect(venue?.status).toBe('Active');
    expect(hostAvailability.slots.every((slot) => slot.id.startsWith('slot-'))).toBe(true);
  });

  it('keeps event and payout values normalized rather than page-owned', () => {
    expect(new Set(hostEvents.map((event) => event.id)).size).toBe(hostEvents.length);
    expect(hostPayouts.every((payout) => payout[3].startsWith('₹'))).toBe(true);
  });
});
