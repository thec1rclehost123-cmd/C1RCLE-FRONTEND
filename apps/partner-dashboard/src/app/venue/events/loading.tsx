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
        <span />
        <span />
      </nav>
      <div>
        <span />
        <i />
        <i />
      </div>
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
