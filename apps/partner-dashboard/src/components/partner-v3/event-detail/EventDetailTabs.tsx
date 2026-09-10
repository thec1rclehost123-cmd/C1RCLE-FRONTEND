import Link from 'next/link';

import styles from './event-detail.module.css';

export interface EventDetailTab {
  readonly label: string;
  readonly href: string;
  readonly current?: boolean;
}

export function EventDetailTabs({
  tabs,
  label = 'Event detail sections',
  compact = false,
  accent = 'orange',
}: {
  readonly tabs: readonly EventDetailTab[];
  readonly label?: string;
  readonly compact?: boolean;
  readonly accent?: 'orange' | 'lavender';
}) {
  return (
    <nav
      className={[
        styles['detailTabs'],
        compact ? styles['detailTabsCompact'] : '',
        accent === 'lavender' ? styles['detailTabsLavender'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          className={styles['detailTab']}
          href={tab.href}
          aria-current={tab.current ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
