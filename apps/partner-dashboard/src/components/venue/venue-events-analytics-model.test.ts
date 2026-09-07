import { describe, expect, it } from 'vitest';

import {
  buildVenueEventsAnalyticsModel,
  venueEventsAnalyticsFixture,
} from './venue-events-analytics-model';

describe('buildVenueEventsAnalyticsModel', () => {
  it('calculates gross sales, tickets sold, and average order value from their documented inputs', () => {
    const model = buildVenueEventsAnalyticsModel();
    expect(model.metrics.map((metric) => metric.value)).toEqual(['₹11,70,000', '1,284', '₹909']);
    expect(model.metrics[2]?.definition).toContain('completed paid orders');
  });

  it('uses an explicit unavailable state when demographic aggregates are absent', () => {
    const model = buildVenueEventsAnalyticsModel({
      ...venueEventsAnalyticsFixture,
      demographics: null,
    });
    expect(model.demographics).toBeNull();
    expect(model.demographicUnavailableReason).toContain('not available');
  });

  it('keeps complete consented demographic aggregates in the full-data state', () => {
    const model = buildVenueEventsAnalyticsModel();
    expect(model.demographics?.identifiedGuests).toBe(924);
    expect(model.demographics?.age.map((group) => group.percent)).toEqual([24, 43, 22, 11]);
    expect(model.demographics?.gender.map((group) => group.percent)).toEqual([48, 47, 5]);
  });
});
