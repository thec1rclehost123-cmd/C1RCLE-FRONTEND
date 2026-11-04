import type { CalendarDayState } from '@/data/partner-data-source';

/**
 * Venue owners may create events on empty dates even when no explicit open
 * slot has been configured. Hosts still require an open venue slot.
 */
export function canSelectEventDate(
  state: CalendarDayState,
  role: 'venue' | 'host',
  hasOpenSlot = false,
): boolean {
  return (
    state === 'available' ||
    (role === 'host' && hasOpenSlot) ||
    (role === 'venue' && state === 'unavailable')
  );
}
