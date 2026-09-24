import { PartnerEventSalesScreen } from './PartnerEventSalesScreen';

import type { EventSalesView, PartnerEventDetailData } from '@/data/partner-data-source';

export function VenueEventSalesScreen({
  data,
  view,
}: {
  readonly data: PartnerEventDetailData;
  readonly view: EventSalesView;
}) {
  return (
    <PartnerEventSalesScreen
      data={data}
      view={view}
      config={{
        accent: 'orange',
        detailHref: `/partner/venue/events/${data.event.id}`,
        doorHref: '/partner/venue/door',
        eventsHref: '/partner/venue/events',
      }}
    />
  );
}
