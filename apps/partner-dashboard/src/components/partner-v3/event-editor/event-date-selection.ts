import type { CalendarDayState } from '@/data/partner-data-source';

/**
 * Venue owners may create events on empty dates even when no explicit open
 * slot has been configured. Hosts still require an open venue slot.
 */
export function canSelectEventDate(
  state: CalendarDayState,
  role: 'venue' | 'host',
): boolean {
  return state === 'available' || (role === 'venue' && state === 'unavailable');
}
