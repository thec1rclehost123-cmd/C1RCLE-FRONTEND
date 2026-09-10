import styles from './event-detail.module.css';

import type { ReactNode } from 'react';

export function EventDetailSection({
  className = '',
  title,
  description,
  children,
}: {
  readonly className?: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly children: ReactNode;
}) {
  return (
    <section className={[styles['detailSection'], className].filter(Boolean).join(' ')}>
      <header className={styles['detailSectionHeader']}>
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}
