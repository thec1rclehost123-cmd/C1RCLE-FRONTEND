import { PartnerNetworkScreen } from './PartnerNetworkScreen';

import type { PartnerSegment, PartnerSubView, VenuePartnersData } from '@/data/partner-data-source';

export function VenuePartnersScreen({
  data,
  segment = 'hosts',
  subView = 'connected',
  search = '',
  profileId,
  organizationId,
}: {
  readonly data: VenuePartnersData;
  readonly segment?: PartnerSegment;
  readonly subView?: PartnerSubView;
  readonly search?: string;
  readonly profileId?: string;
  readonly organizationId?: string;
}) {
  return (
    <PartnerNetworkScreen
      data={{ primary: data.hosts, promoters: data.promoters, staff: data.staff }}
      baseHref="/partner/venue/partners"
      primarySegment="hosts"
      primaryLabel="Hosts"
      primarySubLabel="My partners"
      segment={segment}
      subView={subView}
      search={search}
      {...(profileId ? { profileId } : {})}
      {...(organizationId ? { organizationId } : {})}
    />
  );
}
