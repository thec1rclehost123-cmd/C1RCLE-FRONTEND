import { UsersIcon } from '@c1rcle/icons';

import styles from './event-sales.module.css';
import { EventSalesBar, EventSalesPanel, salesToneClasses } from './EventSalesPanel';

import type { EventSalesData } from '@/data/partner-data-source';

export function EventCrowdBreakdown({
  accent = 'orange',
  data,
}: {
  readonly accent?: 'orange' | 'lavender';
  readonly data: EventSalesData['crowd'];
}) {
  return (
    <div className={styles['salesStack']}>
      <div className={styles['salesHeading']}>
        <span className={[styles['salesHeadingIcon'], salesToneClasses.pink].join(' ')}>
          <UsersIcon size={15} aria-hidden="true" />
        </span>
        <h2>Crowd &amp; Demographics</h2>
      </div>
      <div className={styles['salesTwoColumn']}>
        <EventSalesPanel eyebrow="Gender Split">
          <div className={styles['genderContent']}>
            <svg className={styles['genderDonut']} viewBox="0 0 128 128" aria-label="Gender split">
              <circle cx="64" cy="64" r="54" className={styles['genderTrack']} />
              {data.gender.map((segment) => (
                <circle
                  className={[styles['genderSegment'], salesToneClasses[segment.tone]].join(' ')}
                  cx="64"
                  cy="64"
                  r="54"
                  key={segment.label}
                  strokeDasharray={segment.dashArray}
                  strokeDashoffset={segment.dashOffset}
                />
              ))}
            </svg>
            <div className={styles['genderLegend']}>
              {data.gender.map((segment) => (
                <div className={styles['genderLegendRow']} key={segment.label}>
                  <span
                    className={[styles['legendSwatch'], salesToneClasses[segment.tone]].join(' ')}
                  />
                  <span>{segment.label}</span>
                  <strong>{segment.percent}%</strong>
                </div>
              ))}
            </div>
          </div>
        </EventSalesPanel>
        <EventSalesPanel eyebrow="Age Distribution">
          <div className={styles['salesRows']}>
            {data.age.map((bracket) => (
              <div className={styles['ageRow']} key={bracket.label}>
                <span>{bracket.label}</span>
                <div className={styles['salesBarTrack']}>
                  <EventSalesBar fillPercent={bracket.fillPercent} tone={bracket.tone} />
                </div>
                <strong>{bracket.count}</strong>
                <em className={accent === 'lavender' ? salesToneClasses.lavender : undefined}>
                  {bracket.percent}
                </em>
              </div>
            ))}
          </div>
        </EventSalesPanel>
      </div>
      <div className={styles['crowdSegmentGrid']}>
        {data.segments.map((segment) => (
          <EventSalesPanel key={segment.label}>
            <div className={styles['crowdSegmentLabel']}>
              <span className={salesToneClasses[segment.tone]} />
              {segment.label}
            </div>
            <strong className={salesToneClasses[segment.tone]}>{segment.value}</strong>
            <small>{segment.sub}</small>
          </EventSalesPanel>
        ))}
      </div>
      <EventSalesPanel eyebrow="Loyalty Tiers">
        <div className={styles['loyaltyGrid']}>
          {data.loyalty.map((tier) => (
            <div
              className={[styles['loyaltyCard'], salesToneClasses[tier.tone]].join(' ')}
              key={tier.label}
            >
              <span>{tier.label}</span>
              <strong>{tier.value}</strong>
            </div>
          ))}
        </div>
      </EventSalesPanel>
    </div>
  );
}
