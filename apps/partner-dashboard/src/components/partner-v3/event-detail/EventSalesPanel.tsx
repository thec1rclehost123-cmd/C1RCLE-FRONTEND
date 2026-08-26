import styles from './event-sales.module.css';

import type { EventSalesTone } from '@/data/partner-data-source';
import type { ReactNode } from 'react';

export const salesToneClasses: Readonly<Record<EventSalesTone, string>> = {
  orange: styles['toneOrange'] ?? '',
  violet: styles['toneViolet'] ?? '',
  lavender: styles['toneLavender'] ?? '',
  teal: styles['toneTeal'] ?? '',
  pink: styles['tonePink'] ?? '',
  yellow: styles['toneYellow'] ?? '',
  green: styles['toneGreen'] ?? '',
  red: styles['toneRed'] ?? '',
  muted: styles['toneMuted'] ?? '',
};

export const salesWidthClasses: Readonly<Record<number, string>> = {
  0: styles['width0'] ?? '',
  9: styles['width9'] ?? '',
  25: styles['width25'] ?? '',
  32: styles['width32'] ?? '',
  35: styles['width35'] ?? '',
  38: styles['width38'] ?? '',
  40: styles['width40'] ?? '',
  42: styles['width42'] ?? '',
  52: styles['width52'] ?? '',
  58: styles['width58'] ?? '',
  60: styles['width60'] ?? '',
  62: styles['width62'] ?? '',
  70: styles['width70'] ?? '',
  86: styles['width86'] ?? '',
  76: styles['width76'] ?? '',
  82: styles['width82'] ?? '',
  94: styles['width94'] ?? '',
  100: styles['width100'] ?? '',
};

export function EventSalesPanel({ title, eyebrow, children }: { readonly title?: string; readonly eyebrow?: string; readonly children: ReactNode }) {
  return (
    <article className={styles['salesPanel']}>
      {eyebrow ? <div className={styles['salesPanelEyebrow']}>{eyebrow}</div> : null}
      {title ? <h3 className={styles['salesPanelTitle']}>{title}</h3> : null}
      {children}
    </article>
  );
}

export function EventSalesBar({ fillPercent, tone }: { readonly fillPercent: number; readonly tone: EventSalesTone }) {
  return <span className={[styles['salesBar'], salesToneClasses[tone], salesWidthClasses[fillPercent] ?? ''].filter(Boolean).join(' ')} />;
}
