import styles from './partner-v3.module.css';

import type { ReactNode } from 'react';


export function Skeleton({ className }: { readonly className?: string }) {
  return <span className={[styles['skeleton'], className].filter(Boolean).join(' ')} aria-hidden="true" />;
}

export function EmptyState({ title, description, action }: { readonly title: string; readonly description: string; readonly action?: ReactNode }) {
  return (
    <section className={styles['emptyState']} aria-live="polite">
      <span className={styles['emptyStateMark']} aria-hidden="true">—</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className={styles['emptyStateAction']}>{action}</div> : null}
    </section>
  );
}

export function LoadingState({ label = 'Loading' }: { readonly label?: string }) {
  return (
    <div className={styles['loadingState']} role="status" aria-live="polite">
      <span className={styles['partnerV3Spinner']} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: { readonly title?: string; readonly description: string; readonly onRetry?: () => void }) {
  return (
    <section className={styles['errorState']} role="alert">
      <span className={styles['errorMark']} aria-hidden="true">!</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {onRetry ? <button type="button" onClick={onRetry}>Try again</button> : null}
    </section>
  );
}
