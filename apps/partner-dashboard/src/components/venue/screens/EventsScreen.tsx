import Link from 'next/link';

import { SLOT_REQUESTS } from '../data';
import { venueEventSource } from '../venue-events-model';

import styles from './VenueEvents.module.css';
import { VenueEventsExplorer } from './VenueEventsExplorer';

export function EventsScreen() {
  const requestCount = SLOT_REQUESTS.filter((request) => request.status === 'pending').length;

  if (venueEventSource.events.length === 0) {
    return (
      <section className={styles['emptyState']}>
        <span>No events yet</span>
        <h1>Your venue has no events to show.</h1>
        <p>Create an event to begin tracking programming, tickets, and revenue.</p>
        <Link href="/venue/events/create">Create event</Link>
      </section>
    );
  }

  return (
    <VenueEventsExplorer
      events={venueEventSource.events}
      totalCount={venueEventSource.totalCount}
      requestCount={requestCount}
    />
  );
}
