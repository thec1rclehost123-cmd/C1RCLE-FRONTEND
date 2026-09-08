import { PartnerEventsScreen } from './PartnerEventsScreen';

import type { PartnerEventParty, VenueEventsData } from '@/data/partner-data-source';

const venueEventsConfig = {
  accent: 'orange',
  analyticsHref: '/partner/venue/events/analytics',
  createEventHref: '/partner/venue/events/create',
  eventsBaseHref: '/partner/venue/events',
  eventSectionLabel: 'Venue',
  partyFilterLabel: 'Event ownership',
  showViewToggle: true,
  slotRequestsHref: '/partner/venue/slot-requests',
} as const;

export function VenueEventsScreen({
  data,
  initialSearch,
  initialStatus,
  initialParty,
  initialView,
}: {
  readonly data: VenueEventsData;
  readonly initialSearch?: string;
  readonly initialStatus?: 'all' | 'Live' | 'Draft';
  readonly initialParty?: PartnerEventParty;
  readonly initialView?: 'list' | 'grid';
}) {
  return (
    <PartnerEventsScreen
      config={venueEventsConfig}
      data={data}
      initialSearch={initialSearch}
      initialStatus={initialStatus}
      initialParty={initialParty}
      initialView={initialView}
    />
  );
}
