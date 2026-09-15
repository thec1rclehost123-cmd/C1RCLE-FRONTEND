import { PartnerNetworkScreen } from './PartnerNetworkScreen';

import type { PartnerRelationship, PartnerRequest, PartnerSegment, PartnerSubView, VenuePartnersData } from '@/data/partner-data-source';

export function VenuePartnersScreen({ data, segment = 'hosts', subView = 'connected', search = '', profileId, pendingRequestId = null, pendingRequestAction = null, requestErrorId = null, requestError = null, connectingPartnerId = null, connectErrorId = null, connectError = null, onApproveRequest, onRejectRequest, onConnectPartner }: {
  readonly data: VenuePartnersData;
  readonly segment?: PartnerSegment;
  readonly subView?: PartnerSubView;
  readonly search?: string;
  readonly profileId?: string;
  readonly pendingRequestId?: string | null;
  readonly pendingRequestAction?: 'approve' | 'reject' | null;
  readonly requestErrorId?: string | null;
  readonly requestError?: string | null;
  readonly connectingPartnerId?: string | null;
  readonly connectErrorId?: string | null;
  readonly connectError?: string | null;
  readonly onApproveRequest?: ((request: PartnerRequest) => void) | undefined;
  readonly onRejectRequest?: ((request: PartnerRequest) => void) | undefined;
  readonly onConnectPartner?: ((partner: PartnerRelationship) => void) | undefined;
}) {
  return <PartnerNetworkScreen data={{ primary: data.hosts, promoters: data.promoters, staff: data.staff }} baseHref="/partner/venue/partners" primarySegment="hosts" primaryLabel="Hosts" primarySubLabel="My partners" segment={segment} subView={subView} search={search} {...(profileId ? { profileId } : {})} pendingRequestId={pendingRequestId} pendingRequestAction={pendingRequestAction} requestErrorId={requestErrorId} requestError={requestError} connectingPartnerId={connectingPartnerId} connectErrorId={connectErrorId} connectError={connectError} onApproveRequest={onApproveRequest} onRejectRequest={onRejectRequest} onConnectPartner={onConnectPartner} />;
}
