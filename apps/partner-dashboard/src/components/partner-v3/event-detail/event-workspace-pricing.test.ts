import { describe, expect, it } from 'vitest';

import { formatEventBasePrice, formatEventStartingPrice } from './event-workspace-pricing';

describe('event workspace prices', () => {
  const event = {
    isFree: false,
    startingPricePaise: 99_900,
    currentStartingPricePaise: 65_000,
  };

  it('shows the current sellable price separately from the base price', () => {
    expect(formatEventStartingPrice(event)).toBe('₹650.00');
    expect(formatEventBasePrice(event)).toBe('₹999.00');
  });

  it('does not claim the base price is currently purchasable when no active price exists', () => {
    expect(formatEventStartingPrice({ ...event, currentStartingPricePaise: null })).toBe(
      'No active price',
    );
    expect(formatEventBasePrice({ ...event, currentStartingPricePaise: null })).toBe('₹999.00');
  });

  it('keeps free events clear and legacy base prices distinct', () => {
    expect(
      formatEventStartingPrice({
        isFree: true,
        startingPricePaise: 0,
        currentStartingPricePaise: 0,
      }),
    ).toBe('Free');
    expect(
      formatEventStartingPrice({
        isFree: false,
        startingPricePaise: null,
        currentStartingPricePaise: null,
      }),
    ).toBe('No active price');
    expect(
      formatEventBasePrice({
        isFree: false,
        startingPricePaise: null,
        currentStartingPricePaise: null,
      }),
    ).toBe('Not set');
  });
});
