import { PartnerNetworkScreen } from './PartnerNetworkScreen';

import type { HostPartnersData, PartnerSegment, PartnerSubView } from '@/data/partner-data-source';

export function HostPartnersScreen({
  data,
  segment = 'venues',
  subView = 'connected',
  search = '',
  profileId,
  organizationId,
}: {
  readonly data: HostPartnersData;
  readonly segment?: PartnerSegment;
  readonly subView?: PartnerSubView;
  readonly search?: string;
  readonly profileId?: string;
  readonly organizationId?: string;
}) {
  return (
    <PartnerNetworkScreen
      data={{ primary: data.venues, promoters: data.promoters, staff: data.staff }}
      baseHref="/partner/host/partners"
      primarySegment="venues"
      primaryLabel="Venues"
      primarySubLabel="My Venues"
      segment={segment}
      subView={subView}
      search={search}
      showSearch={false}
      hostAccent
      {...(profileId ? { profileId } : {})}
      {...(organizationId ? { organizationId } : {})}
    />
  );
}
