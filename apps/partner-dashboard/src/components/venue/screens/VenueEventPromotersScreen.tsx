import Link from 'next/link';

import { TicketIcon, UsersIcon } from '@c1rcle/icons';

import { EventPromoterTable, InvitePromoterAction } from '../event-detail/EventPromoterTable';
import styles from '../event-detail/VenueEventOperations.module.css';

import type { VenueEventPromotersModel } from '../event-detail-model';

export function VenueEventPromotersScreen({
  model,
}: {
  readonly model: VenueEventPromotersModel | null;
}) {
  return (
    <div className={styles['operationsPage']}>
      <header className={styles['pageHeader']}>
        <div>
          <h2>Promoters</h2>
          <p>People selling tickets for this event.</p>
        </div>
        <InvitePromoterAction />
      </header>

      {!model ? (
        <section className={styles['emptyState']}>
          <h3>No promoters are linked.</h3>
          <p>Invite a promoter when the invitation service is available.</p>
          <Link href="/venue/events">Return to events</Link>
        </section>
      ) : (
        <>
          <section className={styles['promoterSummary']} aria-label="Promoter summary">
            <article>
              <UsersIcon size={29} aria-hidden="true" />
              <strong>{model.activePromoters.toLocaleString('en-IN')}</strong>
              <span>active promoters</span>
            </article>
            <article>
              <TicketIcon size={29} aria-hidden="true" />
              <strong>{model.ticketsSold.toLocaleString('en-IN')}</strong>
              <span>tickets sold by promoters</span>
            </article>
          </section>
          <EventPromoterTable model={model} />
        </>
      )}
    </div>
  );
}
