import Link from 'next/link';

import { DoorModeIcon } from '@c1rcle/icons';

import styles from './event-operations.module.css';
import { EventSalesBar, EventSalesPanel } from './EventSalesPanel';
import {
  PartnerEventDetailFrame,
  type PartnerEventDetailScreenConfig,
} from './PartnerEventDetailScreen';

import type { EventOperationsData, PartnerEventDetailData } from '@/data/partner-data-source';

interface EventOperationsScreenConfig extends PartnerEventDetailScreenConfig {
  readonly eventHref: string;
}

export function EventOperationsScreen({
  data,
  config,
}: {
  readonly data: PartnerEventDetailData;
  readonly config: EventOperationsScreenConfig;
}) {
  return (
    <PartnerEventDetailFrame data={data} config={config} activeDetailTab="tonight">
      <div className={styles['operationsGrid']}>
        <EventSalesPanel title="How full we are">
          <div className={styles['occupancyValue']}>
            <strong>{data.operations.insideNow}</strong>
            <span>inside now</span>
          </div>
          <div className={styles['occupancyTrack']}>
            <EventSalesBar
              fillPercent={data.operations.occupancyPercent}
              tone={config.accent === 'lavender' ? 'lavender' : 'orange'}
            />
          </div>
          <p>
            {data.operations.occupancyPercent}% of {data.operations.capacity} capacity ·{' '}
            {data.operations.expected}
          </p>
        </EventSalesPanel>
        <EventSalesPanel>
          <div className={styles['walkInHeader']}>
            <span>Walk-ins log</span>
            <Link href={config.doorHref}>
              <DoorModeIcon size={14} aria-hidden="true" />+ Walk-in
            </Link>
          </div>
          <div className={styles['walkInList']}>
            <WalkInRows data={data.operations} />
          </div>
        </EventSalesPanel>
      </div>
    </PartnerEventDetailFrame>
  );
}

function WalkInRows({ data }: { readonly data: EventOperationsData }) {
  return (
    <>
      {data.walkIns.map((walkIn) => (
        <div className={styles['walkInRow']} key={walkIn.id}>
          <div>
            <strong>{walkIn.name}</strong>
            <small>{walkIn.meta}</small>
          </div>
          <time>{walkIn.time}</time>
        </div>
      ))}
    </>
  );
}
