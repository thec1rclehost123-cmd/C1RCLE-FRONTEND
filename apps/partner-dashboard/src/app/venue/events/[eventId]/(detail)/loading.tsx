import styles from './EventDetailRouteStates.module.css';

export default function VenueEventDetailLoading() {
  return (
    <div className={styles['loading']} role="status" aria-label="Loading event details">
      <section>
        <span />
        <span />
        <span />
      </section>
      <div>
        <i />
        <i />
      </div>
      <article />
    </div>
  );
}
