import { PartnerNetworkScreen } from './PartnerNetworkScreen';

import type { HostPartnersData, PartnerSegment, PartnerSubView } from '@/data/partner-data-source';

export function HostPartnersScreen({
  data,
  segment = 'venues',
  subView = 'connected',
  search = '',
  profileId,
  organizationId,
  connectingPartnerId,
  connectErrorId,
  connectError,
  onConnectPartner,
}: {
  readonly data: HostPartnersData;
  readonly segment?: PartnerSegment;
  readonly subView?: PartnerSubView;
  readonly search?: string;
  readonly profileId?: string;
  readonly organizationId?: string;
  readonly connectingPartnerId?: string | null;
  readonly connectErrorId?: string | null;
  readonly connectError?: string | null;
  readonly onConnectPartner?: ((partner: import('@/data/partner-data-source').PartnerRelationship) => void) | undefined;
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
      connectingPartnerId={connectingPartnerId ?? null}
      connectErrorId={connectErrorId ?? null}
      connectError={connectError ?? null}
      onConnect={onConnectPartner}
    />
  );
}
