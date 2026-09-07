import Link from 'next/link';

import { venueEventSource } from '../venue-events-model';

import styles from './VenueEvents.module.css';
import { VenueEventsExplorer } from './VenueEventsExplorer';

export function EventsScreen() {
  if (venueEventSource.events.length === 0) {
    return (
      <section className={styles['emptyState']}>
        <span>No events yet</span>
        <h1>Your venue has no events to show.</h1>
        <p>Create an event to begin managing what is live and coming up.</p>
        <Link href="/venue/events/create">Create event</Link>
      </section>
    );
  }

  return <VenueEventsExplorer source={venueEventSource} />;
}
