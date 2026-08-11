'use client';

import { RefreshIcon } from '@c1rcle/icons';

export default function VenueError({ reset }: { readonly reset: () => void }) {
  return (
    <section className="venue-overview-error" role="alert">
      <span aria-hidden="true">!</span>
      <h1>Venue Overview could not be loaded.</h1>
      <p>
        Your dashboard navigation is still available. Retry the Overview request when you are ready.
      </p>
      <button type="button" onClick={reset}>
        <RefreshIcon size={17} aria-hidden="true" />
        Retry
      </button>
    </section>
  );
}
