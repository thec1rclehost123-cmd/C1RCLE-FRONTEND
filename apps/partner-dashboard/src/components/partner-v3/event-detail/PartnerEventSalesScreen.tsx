import { EventSalesExperience } from './EventSalesExperience';
import {
  PartnerEventDetailFrame,
  type PartnerEventDetailScreenConfig,
} from './PartnerEventDetailScreen';

import type { EventSalesView, PartnerEventDetailData } from '@/data/partner-data-source';

export function PartnerEventSalesScreen({
  data,
  config,
  view,
}: {
  readonly data: PartnerEventDetailData;
  readonly config: PartnerEventDetailScreenConfig;
  readonly view: EventSalesView;
}) {
  return (
    <PartnerEventDetailFrame data={data} activeDetailTab="sales" salesView={view} config={config}>
      <EventSalesExperience accent={config.accent} data={data} view={view} />
    </PartnerEventDetailFrame>
  );
}
