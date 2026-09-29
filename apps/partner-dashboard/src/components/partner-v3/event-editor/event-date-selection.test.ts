import { describe, expect, it } from 'vitest';

import { canSelectEventDate } from './event-date-selection';

describe('canSelectEventDate', () => {
  it('allows venue owners to use an empty date without configured slots', () => {
    expect(canSelectEventDate('unavailable', 'venue')).toBe(true);
  });

  it('still requires an explicit open slot for hosts', () => {
    expect(canSelectEventDate('unavailable', 'host')).toBe(false);
    expect(canSelectEventDate('available', 'host')).toBe(true);
  });

  it.each(['confirmed', 'pending', 'blocked'] as const)('rejects %s dates', (state) => {
    expect(canSelectEventDate(state, 'venue')).toBe(false);
    expect(canSelectEventDate(state, 'host')).toBe(false);
  });
});
