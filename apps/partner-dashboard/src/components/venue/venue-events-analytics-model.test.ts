import { describe, expect, it } from 'vitest';

import { buildVenueEventsAnalyticsModel } from './venue-events-analytics-model';

describe('buildVenueEventsAnalyticsModel', () => {
  it('normalizes approved Overview totals into the aggregate Events report', () => {
    const model = buildVenueEventsAnalyticsModel();
    expect(model.metrics.map((metric) => metric.value)).toEqual([
      '₹11,70,000',
      '₹9,84,200',
      '1,284',
      '₹909',
    ]);
    expect(model.eventComparison).toHaveLength(4);
  });

  it('uses an explicit unavailable state when demographic aggregates are absent', () => {
    const model = buildVenueEventsAnalyticsModel(null);
    expect(model.demographics).toBeNull();
    expect(model.demographicUnavailableReason).toContain('not connected');
  });
});
