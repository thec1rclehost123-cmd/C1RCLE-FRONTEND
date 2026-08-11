import { describe, expect, it } from 'vitest';

import {
  capacityPercentage,
  formatInrFromPaise,
  percentageChange,
  venueOverviewModel,
} from './overview-model';

describe('venueOverviewModel', () => {
  it('keeps the approved Indian currency values and summary formulas consistent', () => {
    expect(formatInrFromPaise(117_000_000)).toBe('₹11,70,000');
    expect(venueOverviewModel.metrics.map((metric) => metric.value)).toEqual([
      '₹11,70,000',
      '₹9,84,200',
      '1,284',
    ]);
  });

  it('derives capacity and comparison percentages from source values', () => {
    expect(capacityPercentage(340, 400)).toBe(85);
    expect(capacityPercentage(4, 0)).toBe(0);
    expect(percentageChange(1_284, 1_052)).toBeCloseTo(22.1, 1);
    expect(venueOverviewModel.tonight.capacityPercent).toBe(85);
  });
});
