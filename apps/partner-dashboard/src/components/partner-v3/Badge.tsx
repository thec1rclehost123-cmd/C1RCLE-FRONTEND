import styles from './partner-v3.module.css';

import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  readonly children: ReactNode;
  readonly tone?: 'neutral' | 'accent' | 'success' | 'warning';
  readonly className?: string;
}) {
  const toneClass = {
    neutral: styles['badgeNeutral'],
    accent: styles['badgeAccent'],
    success: styles['badgeSuccess'],
    warning: styles['badgeWarning'],
  }[tone];
  return (
    <span className={[styles['badge'], toneClass, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
