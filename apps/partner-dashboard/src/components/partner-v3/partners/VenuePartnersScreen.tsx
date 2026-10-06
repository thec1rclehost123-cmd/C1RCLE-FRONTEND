import { PartnerNetworkScreen, type PartnerRequestActions } from './PartnerNetworkScreen';

import type {
  PartnerRelationship,
  PartnerSegment,
  PartnerSubView,
  VenuePartnersData,
} from '@/data/partner-data-source';

type VenuePartnersScreenProps =
  VenuePartnersDataProps &
  PartnerRequestActions<PartnerRelationship>;

interface VenuePartnersDataProps {
  readonly data: VenuePartnersData;
  readonly segment?: PartnerSegment;
  readonly subView?: PartnerSubView;
  readonly search?: string;
  readonly profileId?: string;
  readonly organizationId?: string;
}

export function VenuePartnersScreen({
  data,
  segment = 'hosts',
  subView = 'connected',
  search = '',
  profileId,
  organizationId,
  pendingRequestId,
  pendingRequestAction,
  requestErrorId,
  requestError,
  connectingPartnerId,
  connectErrorId,
  connectError,
  onApproveRequest,
  onRejectRequest,
  onConnectPartner,
}: VenuePartnersScreenProps) {
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
      pendingRequestId={pendingRequestId ?? null}
      pendingRequestAction={pendingRequestAction ?? null}
      requestErrorId={requestErrorId ?? null}
      requestError={requestError ?? null}
      connectingPartnerId={connectingPartnerId ?? null}
      connectErrorId={connectErrorId ?? null}
      connectError={connectError ?? null}
      onApproveRequest={onApproveRequest}
      onRejectRequest={onRejectRequest}
      onConnect={onConnectPartner}
    />
  );
}
