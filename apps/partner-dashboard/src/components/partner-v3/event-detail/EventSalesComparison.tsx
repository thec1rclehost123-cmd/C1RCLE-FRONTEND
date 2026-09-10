import styles from './event-sales.module.css';
import { EventSalesPanel, salesToneClasses } from './EventSalesPanel';

import type { EventSalesData } from '@/data/partner-data-source';

export function EventSalesComparison({
  accent = 'orange',
  rows,
}: {
  readonly accent?: 'orange' | 'lavender';
  readonly rows: EventSalesData['comparison'];
}) {
  return (
    <EventSalesPanel title="Compare against past events">
      <p className={styles['salesPanelDescription']}>Same venue, most recent editions</p>
      <div className={styles['comparisonScroller']}>
        <div className={styles['comparisonTable']}>
          <div className={styles['comparisonHeader']}>
            <span>Event</span>
            <span>Sold</span>
            <span>Revenue</span>
            <span>Fill</span>
          </div>
          {rows.map((row) => (
            <div className={styles['comparisonRow']} key={row.name}>
              <span
                className={
                  row.current
                    ? [
                        styles['comparisonCurrent'],
                        accent === 'lavender' ? styles['comparisonCurrentLavender'] : '',
                      ]
                        .filter(Boolean)
                        .join(' ')
                    : styles['comparisonName']
                }
              >
                {row.name}
              </span>
              <strong>{row.sold}</strong>
              <strong>{row.revenue}</strong>
              <strong className={salesToneClasses[row.tone]}>{row.fill}</strong>
            </div>
          ))}
        </div>
      </div>
    </EventSalesPanel>
  );
}
