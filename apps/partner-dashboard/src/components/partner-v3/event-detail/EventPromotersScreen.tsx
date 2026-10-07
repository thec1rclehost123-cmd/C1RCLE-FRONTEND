import Link from 'next/link';

import { AddIcon, CheckIcon, SearchIcon, TrendUpIcon, UsersIcon } from '@c1rcle/icons';

import styles from './event-promoters.module.css';
import { EventSalesPanel } from './EventSalesPanel';
import {
  PartnerEventDetailFrame,
  type PartnerEventDetailScreenConfig,
} from './PartnerEventDetailScreen';

import type { EventPromotersData, PartnerEventDetailData } from '@/data/partner-data-source';
import type { ReactNode } from 'react';

interface EventPromotersScreenConfig extends PartnerEventDetailScreenConfig {
  readonly eventHref: string;
  readonly guestsHref: string;
}

export function EventPromotersScreen({
  data,
  config,
  search = '',
}: {
  readonly data: PartnerEventDetailData;
  readonly config: EventPromotersScreenConfig;
  readonly search?: string;
}) {
  const promoters = data.promoters.promoters.filter((promoter) =>
    promoter.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <PartnerEventDetailFrame data={data} config={config} activeDetailTab="promoters">
      <section
        className={[
          styles['promotersSection'],
          config.accent === 'lavender' ? styles['promotersHost'] : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles['promotersHeader']}>
          <div>
            <h2>Promoters &amp; Sales</h2>
            <p>Monitor sales performance and comparison across promoters</p>
          </div>
          <button
            className={styles['addPromoter']}
            disabled
            title="Adding promoters is unavailable in fixture mode"
            type="button"
          >
            <AddIcon size={15} aria-hidden="true" />
            Add Promoter to Event
          </button>
        </div>
        <div className={styles['promoterToolbar']}>
          <form className={styles['promoterSearch']} action={config.eventHref} method="get">
            <SearchIcon size={15} aria-hidden="true" />
            <input
              aria-label="Search promoters"
              defaultValue={search}
              name="search"
              placeholder="Search promoters..."
            />
          </form>
          <button
            className={styles['selectAll']}
            disabled
            title="Promoter selection is unavailable in fixture mode"
            type="button"
          >
            <CheckIcon size={14} aria-hidden="true" />
            Select All
          </button>
        </div>
        {promoters.length > 0 ? (
          <div className={styles['promoterGrid']}>
            <PromoterCards data={promoters} guestsHref={config.guestsHref} />
          </div>
        ) : (
          <div className={styles['promoterEmpty']}>
            No promoters match this search. <Link href={config.eventHref}>Clear search</Link>
          </div>
        )}
      </section>
    </PartnerEventDetailFrame>
  );
}

function PromoterCards({
  data,
  guestsHref,
}: {
  readonly data: readonly EventPromotersData['promoters'][number][];
  readonly guestsHref: string;
}) {
  return (
    <>
      {data.map((promoter) => (
        <EventSalesPanel key={promoter.id}>
          <div className={styles['promoterCardHeader']}>
            <span className={styles['promoterAvatar']}>{promoter.initials}</span>
            <strong>{promoter.name}</strong>
            <input aria-label={`Select ${promoter.name}`} disabled type="checkbox" />
          </div>
          <div className={styles['promoterMetrics']}>
            <Metric
              icon={<UsersIcon size={13} aria-hidden="true" />}
              label="Tickets Sold"
              value={promoter.tickets}
            />
            <Metric
              icon={<span className={styles['coinIcon']}>₹</span>}
              label="Revenue Generated"
              value={promoter.revenue}
              tone="revenue"
            />
            <Metric
              icon={<CheckIcon size={13} aria-hidden="true" />}
              label="RSVPs"
              value={promoter.rsvps}
              tone="success"
            />
            <Metric
              icon={<TrendUpIcon size={13} aria-hidden="true" />}
              label="Conversion Rate"
              value={promoter.conversion}
              tone="accent"
            />
          </div>
          <Link className={styles['promoterFooter']} href={guestsHref}>
            View Guest List &amp; Analytics
          </Link>
        </EventSalesPanel>
      ))}
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = 'default',
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
  readonly tone?: 'default' | 'revenue' | 'success' | 'accent';
}) {
  return (
    <div className={styles['promoterMetric']}>
      <span>{label}</span>
      <strong className={styles[`metric${tone.charAt(0).toUpperCase()}${tone.slice(1)}`]}>
        {icon}
        {value}
      </strong>
    </div>
  );
}
