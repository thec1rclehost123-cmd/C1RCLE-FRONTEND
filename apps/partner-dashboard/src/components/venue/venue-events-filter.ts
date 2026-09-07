import type { VenueEvent, VenueEventTab } from './venue-events-model';

export interface VenueEventFilters {
  readonly tab: VenueEventTab;
  readonly query: string;
  readonly status: string;
  readonly venue: string;
  readonly month: string;
}

export const filterVenueEvents = (
  events: readonly VenueEvent[],
  filters: VenueEventFilters,
): readonly VenueEvent[] => {
  const query = filters.query.trim().toLowerCase();
  return events.filter((event) => {
    const matchesQuery =
      !query ||
      [event.name, event.venue, event.city, event.category, event.format, event.host].some(
        (value) => value.toLowerCase().includes(query),
      );
    const matchesTab =
      filters.tab === 'upcoming'
        ? event.status !== 'Past' && event.status !== 'Cancelled'
        : filters.tab === 'live'
          ? event.status === 'Live'
          : filters.tab === 'drafts'
            ? event.status === 'Draft'
            : event.status === 'Past';
    const matchesStatus = filters.status === 'all' || event.status === filters.status;
    const matchesVenue = filters.venue === 'all' || event.venue === filters.venue;
    const matchesMonth = filters.month === 'all' || event.dateIso.slice(0, 7) === filters.month;
    return matchesTab && matchesQuery && matchesStatus && matchesVenue && matchesMonth;
  });
};
