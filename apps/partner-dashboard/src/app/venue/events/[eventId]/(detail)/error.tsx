'use client';

import { RefreshIcon } from '@c1rcle/icons';

import styles from './EventDetailRouteStates.module.css';

export default function VenueEventDetailError({ reset }: { readonly reset: () => void }) {
  return (
    <section className={styles['error']} role="alert">
      <span aria-hidden="true">!</span>
      <h2>Event details could not be loaded.</h2>
      <p>The event header and Venue Studio navigation remain available.</p>
      <button type="button" onClick={reset}>
        <RefreshIcon size={17} aria-hidden="true" />
        Retry
      </button>
    </section>
  );
}
