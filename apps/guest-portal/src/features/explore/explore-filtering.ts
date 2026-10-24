import type { ExploreEvent, ExploreFilters } from './types/explore.types';

function dayKey(value: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(value);
}

function isUpcomingWeekend(startsAt: string, now: Date): boolean {
  const event = new Date(startsAt);
  if (Number.isNaN(event.getTime())) return false;
  const currentDay = now.getUTCDay();
  const daysUntilSaturday = (6 - currentDay + 7) % 7;
  const saturday = new Date(now);
  saturday.setUTCDate(now.getUTCDate() + daysUntilSaturday);
  saturday.setUTCHours(0, 0, 0, 0);
  const monday = new Date(saturday);
  monday.setUTCDate(saturday.getUTCDate() + 2);
  return event >= saturday && event < monday;
}

export function filterExploreEvents(
  events: readonly ExploreEvent[],
  filters: ExploreFilters,
  now = new Date(),
): ExploreEvent[] {
  const search = filters.search.trim().toLowerCase();
  const today = dayKey(now);
  return events
    .filter((event) => {
      const searchable =
        `${event.title} ${event.category} ${event.venue} ${event.city}`.toLowerCase();
      if (search && !searchable.includes(search)) return false;
      if (filters.city && event.cityKey !== filters.city) return false;
      if (filters.category && event.category !== filters.category) return false;
      if (filters.date === 'today' && dayKey(new Date(event.startsAt)) !== today) return false;
      if (filters.date === 'weekend' && !isUpcomingWeekend(event.startsAt, now)) return false;
      return true;
    })
    .toSorted((left, right) => {
      if (filters.sort === 'newest') return Date.parse(right.startsAt) - Date.parse(left.startsAt);
      if (filters.sort === 'price-low') {
        return (left.price?.amountPaise ?? 0) - (right.price?.amountPaise ?? 0);
      }
      return Date.parse(left.startsAt) - Date.parse(right.startsAt);
    });
}

export function deriveCategories(events: readonly ExploreEvent[]): string[] {
  return [...new Set(events.map((event) => event.category))].toSorted();
}

export function filtersToQuery(filters: ExploreFilters): string {
  const query = new URLSearchParams();
  if (filters.search) query.set('q', filters.search);
  if (filters.city) query.set('city', filters.city);
  if (filters.category) query.set('category', filters.category);
  if (filters.date !== 'any') query.set('date', filters.date);
  if (filters.sort !== 'soonest') query.set('sort', filters.sort);
  return query.toString();
}
