import styles from './HomeFeaturedEvents.module.css';
import { HomeFeaturedEventsCarousel } from './HomeFeaturedEventsCarousel';

import type { HomeFeaturedContent } from '../types/home.types';
import type { ExploreEvent } from '@/features/explore/types/explore.types';

export function HomeFeaturedEvents({
  content,
  events,
}: {
  content: HomeFeaturedContent;
  events: readonly ExploreEvent[];
}) {
  if (events.length === 0) return null;

  return (
    <section
      id="featured-events"
      aria-labelledby="featured-events-heading"
      className={styles['section']}
    >
      <div className={styles['header']}>
        <p className={styles['eyebrow']}>
          <span aria-hidden="true" />
          {content.eyebrow}
        </p>
        <h2 id="featured-events-heading" className={styles['heading']}>
          {content.title} <span>{content.highlightedWord}</span>
        </h2>
      </div>
      <HomeFeaturedEventsCarousel events={events.slice(0, 8)} />
    </section>
  );
}
