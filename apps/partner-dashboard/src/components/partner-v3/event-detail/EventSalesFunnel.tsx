import { FilterIcon } from '@c1rcle/icons';

import styles from './event-sales.module.css';
import { EventSalesBar, EventSalesPanel, salesToneClasses } from './EventSalesPanel';

import type { EventSalesData } from '@/data/partner-data-source';


export function EventSalesFunnel({ data }: { readonly data: EventSalesData['funnel'] }) {
  return (
    <div className={styles['salesStack']}>
      <div className={styles['salesHeading']}><span className={[styles['salesHeadingIcon'], salesToneClasses.violet].join(' ')}><FilterIcon size={16} aria-hidden="true" /></span><h2>Conversion Funnel</h2></div>
      <div className={styles['funnelStats']}>
        {data.stats.map((stat) => (
          <article className={styles['funnelStat']} key={stat.label}>
            <span>{stat.label}</span>
            <strong className={salesToneClasses[stat.tone]}>{stat.value}</strong>
          </article>
        ))}
      </div>
      <EventSalesPanel eyebrow="Funnel Stages">
        <div className={styles['funnelSteps']}>
          {data.steps.map((step) => (
            <div className={[styles['funnelStep'], salesToneClasses[step.tone]].join(' ')} key={step.label}>
              <span>{step.label}</span>
              <div className={styles['salesBarTrack']}><EventSalesBar fillPercent={step.fillPercent} tone={step.tone} /></div>
              <strong>{step.count}</strong>
            </div>
          ))}
        </div>
        <p className={styles['salesNote']}>{data.note}</p>
      </EventSalesPanel>
    </div>
  );
}
