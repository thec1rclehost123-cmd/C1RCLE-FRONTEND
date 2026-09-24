import { PartnerEventsScreen } from './PartnerEventsScreen';

import type { HostEventsData, PartnerEventParty } from '@/data/partner-data-source';

const hostEventsConfig = {
  accent: 'lavender',
  analyticsHref: '/partner/host/analytics',
  createEventHref: '/partner/host/events/create',
  eventsBaseHref: '/partner/host/events',
  eventSectionLabel: 'Host',
  partyFilterLabel: 'Event partners',
  showViewToggle: false,
  slotRequestsHref: '/partner/host/slot-requests',
} as const;

export function HostEventsScreen({
  data,
  initialSearch,
  initialStatus,
  initialParty,
  initialView,
}: {
  readonly data: HostEventsData;
  readonly initialSearch?: string;
  readonly initialStatus?: 'all' | 'Live' | 'Draft';
  readonly initialParty?: PartnerEventParty;
  readonly initialView?: 'list' | 'grid';
}) {
  return (
    <PartnerEventsScreen
      config={hostEventsConfig}
      data={data}
      initialSearch={initialSearch}
      initialStatus={initialStatus}
      initialParty={initialParty}
      initialView={initialView}
    />
  );
}
