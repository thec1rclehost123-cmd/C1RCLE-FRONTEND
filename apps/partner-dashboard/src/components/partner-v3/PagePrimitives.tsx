import styles from './partner-v3.module.css';

import type { ReactNode } from 'react';


export function PageContainer({ children }: { readonly children: ReactNode }) {
  return <div className={styles['pageContainer']}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description }: { readonly eyebrow?: string; readonly title: string; readonly description?: string }) {
  return (
    <header className={styles['pageHeader']}>
      {eyebrow ? <span className={styles['eyebrow']}>{eyebrow}</span> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </header>
  );
}

export function PageSection({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return <section className={[styles['pageSection'], className].filter(Boolean).join(' ')}>{children}</section>;
}
