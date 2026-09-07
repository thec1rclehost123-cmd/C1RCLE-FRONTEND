import { CalendarIcon } from '@c1rcle/icons';

import styles from './events.module.css';

export function EventEmptyState({ description, filtered }: { readonly description?: string | undefined; readonly filtered: boolean }) {
  return (
    <section className={styles['emptyState']} aria-live="polite">
      <CalendarIcon size={28} aria-hidden="true" />
      <h2>{filtered ? 'No matching events' : 'No events yet'}</h2>
      <p>{description ?? (filtered ? 'Try a different search or clear the active filters.' : 'Events created or assigned to this venue will appear here.')}</p>
    </section>
  );
}
