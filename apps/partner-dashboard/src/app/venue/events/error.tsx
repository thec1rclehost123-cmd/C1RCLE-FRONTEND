'use client';

import { RefreshIcon } from '@c1rcle/icons';

import styles from './EventsRouteStates.module.css';

export default function VenueEventsError({ reset }: { readonly reset: () => void }) {
  return (
    <section className={styles['error']} role="alert">
      <span aria-hidden="true">!</span>
      <h1>Events could not be loaded.</h1>
      <p>The shared Venue Studio navigation is still available. Retry this Events request.</p>
      <button type="button" onClick={reset}>
        <RefreshIcon size={17} aria-hidden="true" />
        Retry
      </button>
    </section>
  );
}
