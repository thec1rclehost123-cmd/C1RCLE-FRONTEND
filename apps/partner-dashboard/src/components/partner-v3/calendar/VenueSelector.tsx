import { CheckIcon } from '@c1rcle/icons';

import styles from './calendar.module.css';

import type { PartnerVenueOption } from '@/data/partner-data-source';

export function VenueSelector({
  venues,
  selectedVenueId,
  onSelect,
}: {
  readonly venues: readonly PartnerVenueOption[];
  readonly selectedVenueId: string;
  readonly onSelect: (venueId: string) => void;
}) {
  return (
    <section className={styles['venueSelector']} aria-labelledby="venue-selector-title">
      <div>
        <span className={styles['sectionKicker']}>Partnered venues</span>
        <h2 id="venue-selector-title">Choose a venue</h2>
        <p>View only the availability you can request from your venue partners.</p>
      </div>
      <div className={styles['venueOptions']}>
        {venues.map((venue) => (
          <button
            type="button"
            className={selectedVenueId === venue.id ? styles['venueOptionSelected'] : ''}
            aria-pressed={selectedVenueId === venue.id}
            onClick={() => {
              onSelect(venue.id);
            }}
            key={venue.id}
          >
            <span className={styles['venueAvatar']}>
              {venue.name
                .split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <span>
              <strong>{venue.name}</strong>
              <small>{venue.meta}</small>
            </span>
            {selectedVenueId === venue.id ? <CheckIcon size={16} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
