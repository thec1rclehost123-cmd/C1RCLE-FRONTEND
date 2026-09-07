import styles from './event-sales.module.css';
import { EventSalesPanel, salesToneClasses, salesWidthClasses } from './EventSalesPanel';

import type { EventSalesData } from '@/data/partner-data-source';


export function EventRevenueBreakdown({ data }: { readonly data: EventSalesData['revenue'] }) {
  return (
    <div className={styles['salesTwoColumn']}>
      <EventSalesPanel title="Revenue by tier">
        <div className={styles['salesRows']}>
          {data.tiers.map((tier) => (
            <div className={styles['salesRow']} key={tier.name}>
              <div className={styles['salesRowHeader']}><span>{tier.name}</span><strong>{tier.money}</strong></div>
              <div className={styles['salesBarTrack']}><span className={[styles['salesBar'], styles[`tierBar${tier.accent.charAt(0).toUpperCase()}${tier.accent.slice(1)}`], salesWidthClasses[tier.fillPercent] ?? ''].filter(Boolean).join(' ')} /></div>
            </div>
          ))}
        </div>
      </EventSalesPanel>
      <EventSalesPanel title="Net breakdown">
        <div className={styles['breakdownRows']}>
          {data.breakdown.map((row) => <div className={styles['breakdownRow']} key={row.label}><span>{row.label}</span><strong className={salesToneClasses[row.tone]}>{row.value}</strong></div>)}
        </div>
      </EventSalesPanel>
    </div>
  );
}
