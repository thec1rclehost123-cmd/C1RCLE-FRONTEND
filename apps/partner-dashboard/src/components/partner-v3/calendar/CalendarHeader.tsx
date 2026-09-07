import { NextIcon, PreviousIcon } from '@c1rcle/icons';

import styles from './calendar.module.css';

import type { ReactNode } from 'react';


export function CalendarHeader({ title, description, monthLabel, onPrevious, onNext, action }: { readonly title: string; readonly description?: string; readonly monthLabel: string; readonly onPrevious: () => void; readonly onNext: () => void; readonly action?: ReactNode }) {
  return <header className={styles['calendarHeader']}><div><span className={styles['calendarKicker']}>Booking calendar</span><h1>{title}</h1>{description ? <p>{description}</p> : null}</div><div className={styles['calendarHeaderControls']}><button type="button" aria-label="Previous month" onClick={onPrevious}><PreviousIcon size={17} aria-hidden="true" /></button><strong>{monthLabel}</strong><button type="button" aria-label="Next month" onClick={onNext}><NextIcon size={17} aria-hidden="true" /></button>{action ? <span className={styles['headerAction']}>{action}</span> : null}</div></header>;
}
