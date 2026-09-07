import { PartnerEventDetailScreen } from './PartnerEventDetailScreen';

import type { PartnerEventDetailData } from '@/data/partner-data-source';

export function VenueEventDetailScreen({ data }: { readonly data: PartnerEventDetailData }) {
  return <PartnerEventDetailScreen data={data} config={{ accent: 'orange', detailHref: `/partner/venue/events/${data.event.id}`, doorHref: '/partner/venue/door', eventsHref: '/partner/venue/events' }} />;
}
