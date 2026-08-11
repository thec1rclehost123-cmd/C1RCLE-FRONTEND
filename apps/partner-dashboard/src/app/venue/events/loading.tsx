import styles from './EventsRouteStates.module.css';

export default function VenueEventsLoading() {
  return (
    <div className={styles['loading']} role="status" aria-label="Loading Events">
      <header>
        <span />
        <i />
      </header>
      <nav>
        <span />
        <span />
      </nav>
      <section>
        <i />
        <i />
        <i />
        <i />
        <i />
      </section>
    </div>
  );
}
