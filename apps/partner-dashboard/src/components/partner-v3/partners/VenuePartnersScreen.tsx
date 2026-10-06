import { PartnerNetworkScreen, type PartnerRequestActions } from './PartnerNetworkScreen';

import type {
  PartnerRelationship,
  PartnerSegment,
  PartnerSubView,
  StaffInvite,
  VenuePartnersData,
} from '@/data/partner-data-source';

export interface VenuePartnersScreenProps extends PartnerRequestActions<PartnerRelationship> {
  readonly data: VenuePartnersData;
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
  staffInvites = data.staffInvites ?? [],
  staffCanManage = data.staffAccess ? data.staffAccess.canManage : true,
  staffError = data.staffAccess?.error ?? null,
  revokingInviteId = null,
  revokeErrorId = null,
  revokeError = null,
  onRevokeInvite,
  onStaffChanged,
  studioCapability = 'venue',
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

