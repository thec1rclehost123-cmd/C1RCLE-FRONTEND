import { PartnerNetworkScreen, type PartnerRequestActions } from './PartnerNetworkScreen';

import type {
  HostPartnersData,
  PartnerRelationship,
  PartnerSegment,
  PartnerSubView,
  StaffInvite,
} from '@/data/partner-data-source';

export interface HostPartnersScreenProps extends PartnerRequestActions<PartnerRelationship> {
  readonly data: HostPartnersData;
  readonly segment?: PartnerSegment;
  readonly subView?: PartnerSubView;
  readonly search?: string;
  readonly profileId?: string;
  readonly organizationId?: string;
  readonly staffInvites?: readonly StaffInvite[];
  readonly staffCanManage?: boolean;
  readonly staffError?: string | null;
  readonly revokingInviteId?: string | null;
  readonly revokeErrorId?: string | null;
  readonly revokeError?: string | null;
  readonly onRevokeInvite?: ((invite: StaffInvite) => void) | undefined;
  readonly onStaffChanged?: (() => void) | undefined;
  readonly studioCapability?: 'venue' | 'host';
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
  staffInvites = data.staffInvites ?? [],
  staffCanManage = data.staffAccess ? data.staffAccess.canManage : true,
  staffError = data.staffAccess?.error ?? null,
  revokingInviteId = null,
  revokeErrorId = null,
  revokeError = null,
  onRevokeInvite,
  onStaffChanged,
  studioCapability = 'host',
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
      staffInvites={staffInvites}
      staffCanManage={staffCanManage}
      staffError={staffError}
      revokingInviteId={revokingInviteId}
      revokeErrorId={revokeErrorId}
      revokeError={revokeError}
      onRevokeInvite={onRevokeInvite}
      onStaffChanged={onStaffChanged}
      studioCapability={studioCapability}
    />
  );
}
