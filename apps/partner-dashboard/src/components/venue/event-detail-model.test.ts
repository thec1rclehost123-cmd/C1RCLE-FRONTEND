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

  it('derives promoter totals and earnings from attributed tickets and commission source', () => {
    const record = buildVenueEventDetailRecord(venueEventDetailFixture);

    expect(record.promoters).toMatchObject({ activePromoters: 4, ticketsSold: 174 });
    expect(record.promoters?.promoters[0]).toMatchObject({
      name: 'Karan Shah',
      ticketsSold: 62,
      earningsPaise: 1_116_000,
      earnings: '₹11,160',
    });
  });

  it('uses provider campaign results and labels missing results unavailable', () => {
    const record = buildVenueEventDetailRecord(venueEventDetailFixture);

    expect(record.marketing?.recentMessages.map((message) => message.result)).toEqual([
      'Result unavailable',
      '842 opened',
      'Result unavailable',
      'Delivered',
    ]);
  });

  it('reconciles expected payout from gross sales and authoritative deductions', () => {
    const record = buildVenueEventDetailRecord(venueEventDetailFixture);
    const finance = record.finance;
    if (!finance) throw new Error('Fixture finance model is required');
    const gross = finance.breakdown.find((item) => item.label === 'Ticket sales')?.amountPaise;
    const deductions = finance.breakdown
      .filter((item) => ['Refunds', 'Platform fees', 'Taxes'].includes(item.label))
      .reduce((total, item) => total + Math.abs(item.amountPaise), 0);
    const payout = finance.breakdown.find((item) => item.label === 'Expected payout')?.amountPaise;

    expect(gross).toBe(61_200_000);
    expect(deductions).toBe(3_600_000);
    expect(payout).toBe(gross! - deductions);
    expect(finance.summary).toMatchObject({
      grossSales: '₹6,12,000',
      deductions: '₹36,000',
      expectedPayout: '₹5,76,000',
    });
  });

  it('returns a header-only empty state for known events without focused detail data', () => {
    const record = getVenueEventDetailRecord('sunset-sessions-vol-4');

    expect(record?.header.name).toBe('Sunset Sessions Vol. 4');
    expect(record?.summary).toBeNull();
    expect(record?.sales).toBeNull();
    expect(record?.guests).toBeNull();
    expect(record?.promoters).toBeNull();
    expect(record?.marketing).toBeNull();
    expect(record?.finance).toBeNull();
  });

  it('returns null for unknown event ids', () => {
    expect(getVenueEventDetailRecord('missing-event')).toBeNull();
  });
});
