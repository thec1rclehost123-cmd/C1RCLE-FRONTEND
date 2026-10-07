import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './event-detail.module.css';
import { EventDetailHeader } from './EventDetailHeader';
import { EventDetailTabs } from './EventDetailTabs';
import { EventSalesSummary } from './EventSalesSummary';

import type { EventSalesView, PartnerEventDetailData } from '@/data/partner-data-source';
import type { ReactNode } from 'react';

export interface PartnerEventDetailScreenConfig {
  readonly accent: 'orange' | 'lavender';
  readonly eventsHref: string;
  readonly doorHref: string;
  readonly detailHref: string;
}

export type EventDetailPrimaryTab = 'sales' | 'guests' | 'tonight' | 'promoters';

export function PartnerEventDetailFrame({
  data,
  config,
  activeDetailTab,
  salesView,
  children,
}: {
  readonly data: PartnerEventDetailData;
  readonly config: PartnerEventDetailScreenConfig;
  readonly activeDetailTab: EventDetailPrimaryTab;
  readonly salesView?: EventSalesView;
  readonly children: ReactNode;
}) {
  const baseHref = config.detailHref;
  const hostTheme = config.accent === 'lavender' ? styles['detailPageHost'] : '';
  return (
    <PageContainer>
      <div className={[styles['detailPage'], hostTheme].filter(Boolean).join(' ')}>
        <Link className={styles['backLink']} href={config.eventsHref}>
          <span aria-hidden="true">←</span> All events
        </Link>
        <EventDetailTabs
          accent={config.accent}
          tabs={[
            { label: 'Sales', href: baseHref, current: activeDetailTab === 'sales' },
            {
              label: "Who's coming",
              href: `${baseHref}/guests`,
              current: activeDetailTab === 'guests',
            },
            {
              label: 'Tonight',
              href: `${baseHref}/tonight`,
              current: activeDetailTab === 'tonight',
            },
            {
              label: 'Promoters',
              href: `${baseHref}/promoters`,
              current: activeDetailTab === 'promoters',
            },
          ]}
        />
        <EventDetailHeader
          data={data}
          accent={config.accent}
          editHref={`${baseHref}/edit`}
          doorHref={config.doorHref}
        />
        {activeDetailTab === 'sales' ? (
          <EventDetailTabs
            accent={config.accent}
            compact
            label="Sales views"
            tabs={[
              { label: 'Summary', href: baseHref, current: salesView === 'summary' },
              {
                label: 'Funnel',
                href: `${baseHref}/sales?view=funnel`,
                current: salesView === 'funnel',
              },
              {
                label: 'Revenue',
                href: `${baseHref}/sales?view=revenue`,
                current: salesView === 'revenue',
              },
              {
                label: 'Crowd',
                href: `${baseHref}/sales?view=crowd`,
                current: salesView === 'crowd',
              },
              {
                label: 'Compare',
                href: `${baseHref}/sales?view=compare`,
                current: salesView === 'compare',
              },
            ]}
          />
        ) : null}
        {children}
      </div>
    </PageContainer>
  );
}

export function PartnerEventDetailScreen({
  data,
  config,
}: {
  readonly data: PartnerEventDetailData;
  readonly config: PartnerEventDetailScreenConfig;
}) {
  return (
    <PartnerEventDetailFrame
      data={data}
      config={config}
      activeDetailTab="sales"
      salesView="summary"
    >
      <EventSalesSummary summary={data.salesSummary} accent={config.accent} />
    </PartnerEventDetailFrame>
  );
}
