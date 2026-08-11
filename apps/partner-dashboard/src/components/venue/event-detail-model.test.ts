import { describe, expect, it } from 'vitest';

import {
  buildVenueEventDetailRecord,
  getVenueEventDetailRecord,
  venueEventDetailFixture,
} from './event-detail-model';

describe('venue event detail model', () => {
  it('derives approved totals and percentages from the focused fixture source', () => {
    const record = buildVenueEventDetailRecord(venueEventDetailFixture);

    expect(record.summary?.metrics).toEqual({
      ticketsSold: '340 / 400',
      grossSales: '₹6,12,000',
      guestsCheckedIn: '248',
    });
    expect(record.sales?.metrics.map((metric) => metric.value)).toEqual([
      '₹6,12,000',
      '340 / 400',
      '₹3,600',
    ]);
    expect(record.guests).toMatchObject({
      checkedIn: 248,
      remaining: 92,
      issuedGuests: 340,
      checkedInPercent: 73,
    });
    expect(record.summary?.ticketTypes.map((ticket) => ticket.soldPercent)).toEqual([80, 90, 85]);
  });

  it('returns a header-only empty state for known events without focused detail data', () => {
    const record = getVenueEventDetailRecord('sunset-sessions-vol-4');

    expect(record?.header.name).toBe('Sunset Sessions Vol. 4');
    expect(record?.summary).toBeNull();
    expect(record?.sales).toBeNull();
    expect(record?.guests).toBeNull();
  });

  it('returns null for unknown event ids', () => {
    expect(getVenueEventDetailRecord('missing-event')).toBeNull();
  });
});
