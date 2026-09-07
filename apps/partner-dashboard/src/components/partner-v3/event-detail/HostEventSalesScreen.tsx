import { PartnerEventSalesScreen } from './PartnerEventSalesScreen';

import type { EventSalesView, PartnerEventDetailData } from '@/data/partner-data-source';

export function HostEventSalesScreen({ data, view }: { readonly data: PartnerEventDetailData; readonly view: EventSalesView }) {
  return <PartnerEventSalesScreen data={data} view={view} config={{ accent: 'lavender', detailHref: `/partner/host/events/${data.event.id}`, doorHref: '/partner/host/door', eventsHref: '/partner/host/events' }} />;
}
