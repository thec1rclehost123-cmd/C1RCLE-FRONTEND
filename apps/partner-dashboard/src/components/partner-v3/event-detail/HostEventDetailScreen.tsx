import { PartnerEventDetailScreen } from './PartnerEventDetailScreen';

import type { PartnerEventDetailData } from '@/data/partner-data-source';

export function HostEventDetailScreen({ data }: { readonly data: PartnerEventDetailData }) {
  return <PartnerEventDetailScreen data={data} config={{ accent: 'lavender', detailHref: `/partner/host/events/${data.event.id}`, doorHref: '/partner/host/door', eventsHref: '/partner/host/events' }} />;
}
