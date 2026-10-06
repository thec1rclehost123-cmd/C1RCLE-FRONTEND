import { PartnerNetworkScreen, type PartnerRequestActions } from './PartnerNetworkScreen';

import type {
  PartnerRelationship,
  PartnerSegment,
  PartnerSubView,
  HostPartnersData,
} from '@/data/partner-data-source';

type HostPartnersScreenProps = HostPartnersDataProps & PartnerRequestActions<PartnerRelationship>;

interface HostPartnersDataProps {
  readonly data: HostPartnersData;
  readonly segment?: PartnerSegment;
  readonly subView?: PartnerSubView;
  readonly search?: string;
  readonly profileId?: string;
  readonly organizationId?: string;
}

export function HostPartnersScreen({
  data,
  segment = 'venues',
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
}: HostPartnersScreenProps) {
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
