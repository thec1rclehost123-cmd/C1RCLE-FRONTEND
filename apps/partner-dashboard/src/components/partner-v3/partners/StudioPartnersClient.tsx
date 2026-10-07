'use client';

import { useCallback, useEffect, useState } from 'react';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { ErrorState, LoadingState } from '@/components/partner-v3/States';
import {
  resolvePartnershipRequest,
  resolvePromoterRequest,
  sendPartnershipRequest,
  sendPromoterConnectionRequest,
} from '@/lib/api/partner-actions';
import {
  getHostPartnersData,
  getPromoterPartnersData,
  getVenuePartnersData,
} from '@/lib/api/partner-data';

import { HostPartnersScreen } from './HostPartnersScreen';
import { PromoterPartnersScreen } from './PromoterPartnersScreen';
import { VenuePartnersScreen } from './VenuePartnersScreen';

import type {
  HostPartnersData,
  PartnerRelationship,
  PartnerRequest,
  PartnerSegment,
  PartnerSubView,
  PromoterPartnerFilter,
  PromoterPartnerRecord,
  PromoterPartnersData,
  PromoterPartnerTab,
  StaffInvite,
  VenuePartnersData,
} from '@/data/partner-data-source';

type Studio = 'venue' | 'host' | 'promoter';

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'missing-org' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready' };

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Client-only partners loader. All partner rows (venues, hosts, promoters)
 * come from the backend (`partnerships` + `promoter-connections` +
 * `discover-partners`); there is deliberately no fixture/dummy
 * fallback — an empty database renders empty states, never
 * fabricated profiles.
 */
export function StudioPartnersClient({
  studio,
  segment,
  subView,
  search,
  profileId,
  promoterTab,
  promoterFilter,
}: {
  readonly studio: Studio;
  readonly segment: PartnerSegment;
  readonly subView: PartnerSubView;
  readonly search: string;
  readonly profileId?: string;
  readonly promoterTab: PromoterPartnerTab;
  readonly promoterFilter: PromoterPartnerFilter;
}) {
  const [venueData, setVenueData] = useState<VenuePartnersData | null>(null);
  const [hostData, setHostData] = useState<HostPartnersData | null>(null);
  const [promoterData, setPromoterData] = useState<PromoterPartnersData | null>(null);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryCount, setRetryCount] = useState(0);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [pendingRequestAction, setPendingRequestAction] = useState<'approve' | 'reject' | null>(
    null,
  );
  const [requestErrorId, setRequestErrorId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [connectingPartnerId, setConnectingPartnerId] = useState<string | null>(null);
  const [connectErrorId, setConnectErrorId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);
  const [revokeErrorId, setRevokeErrorId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (studio === 'venue') {
          const data = await getVenuePartnersData(search);
          if (mounted) {
            setVenueData(data);
            setState({ status: 'ready' });
          }
        } else if (studio === 'host') {
          const data = await getHostPartnersData(search);
          if (mounted) {
            setHostData(data);
            setState({ status: 'ready' });
          }
        } else {
          const data = await getPromoterPartnersData(search);
          if (mounted) {
            setPromoterData(data);
            setState({ status: 'ready' });
          }
        }
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'No active organization selected') {
          setState({ status: 'missing-org' });
        } else {
          setState({ status: 'error', message });
        }
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [studio, retryCount, search]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setRetryCount((count) => count + 1);
  }, []);

  const handleApproveRequest = useCallback(
    (request: PartnerRequest) => {
      setPendingRequestId(request.id);
      setPendingRequestAction('approve');
      setRequestErrorId(null);
      setRequestError(null);
      const run = async () => {
        if (studio === 'promoter') {
          await resolvePromoterRequest(request.id, 'approve');
        } else {
          await resolvePartnershipRequest(request.id, request.kind, 'approve');
        }
      };
      void run()
        .then(() => {
          setPendingRequestId(null);
          setPendingRequestAction(null);
          reload();
        })
        .catch((error: unknown) => {
          setPendingRequestId(null);
          setPendingRequestAction(null);
          setRequestErrorId(request.id);
          setRequestError(errorMessage(error));
        });
    },
    [reload, studio],
  );

  const handleRejectRequest = useCallback(
    (request: PartnerRequest) => {
      setPendingRequestId(request.id);
      setPendingRequestAction('reject');
      setRequestErrorId(null);
      setRequestError(null);
      const run = async () => {
        if (studio === 'promoter') {
          await resolvePromoterRequest(request.id, 'reject');
        } else {
          await resolvePartnershipRequest(request.id, request.kind, 'reject');
        }
      };
      void run()
        .then(() => {
          setPendingRequestId(null);
          setPendingRequestAction(null);
          reload();
        })
        .catch((error: unknown) => {
          setPendingRequestId(null);
          setPendingRequestAction(null);
          setRequestErrorId(request.id);
          setRequestError(errorMessage(error));
        });
    },
    [reload, studio],
  );

  const handleConnectPartner = useCallback(
    (partner: PartnerRelationship | PromoterPartnerRecord) => {
      setConnectingPartnerId(partner.id);
      setConnectErrorId(null);
      setConnectError(null);
      const run = async () => {
        if (partner.kind === 'promoter') {
          await sendPromoterConnectionRequest({
            studio,
            candidateKind: 'promoter',
            candidateOrganizationId: partner.organizationId ?? partner.id,
          });
          return;
        }
        if (studio === 'promoter') {
          await sendPromoterConnectionRequest({
            studio: 'promoter',
            candidateKind: partner.kind === 'venue' ? 'venue' : 'host',
            candidateOrganizationId: partner.organizationId ?? partner.id,
            candidateVenueId: (partner as PartnerRelationship).venueId ?? null,
          });
          return;
        }
        // Venue ↔ host partnership.
        await sendPartnershipRequest({
          studio: studio === 'venue' ? 'venue' : 'host',
          candidateVenueId:
            (partner as PartnerRelationship).venueId ??
            (partner.kind === 'venue' ? partner.id : null),
          candidateOrganizationId: partner.organizationId ?? partner.id,
        });
      };
      void run()
        .then(() => {
          setConnectingPartnerId(null);
          reload();
        })
        .catch((error: unknown) => {
          setConnectingPartnerId(null);
          setConnectErrorId(partner.id);
          setConnectError(errorMessage(error));
        });
    },
    [reload, studio],
  );

  const handleRevokeInvite = useCallback(
    (invite: StaffInvite) => {
      setRevokingInviteId(invite.id);
      setRevokeErrorId(null);
      setRevokeError(null);
      const run = async () => {
        const { getActiveOrgId } = await import('@/lib/org/active-org');
        const orgId = getActiveOrgId();
        if (!orgId) throw new Error('No active organization selected');
        const { staffApi } = await import('@/lib/api/staff-api');
        await staffApi.revokeInvitation(invite.id);
        reload();
      };
      void run()
        .catch((err: unknown) => {
          setRevokeErrorId(invite.id);
          setRevokeError(errorMessage(err));
        })
        .finally(() => {
          setRevokingInviteId(null);
        });
    },
    [reload],
  );

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <LoadingState label="Loading partners…" />
      </PageContainer>
    );
  }

  if (state.status === 'missing-org') {
    return (
      <PageContainer>
        <ErrorState
          title="No organization selected"
          description="Select an organization to load partners from the backend."
        />
      </PageContainer>
    );
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <ErrorState
          title="Couldn't load partners"
          description="Partner data could not be loaded from the backend. Check your connection and try again."
          onRetry={() => {
            setState({ status: 'loading' });
            setRetryCount((count) => count + 1);
          }}
        />
      </PageContainer>
    );
  }

  if (studio === 'venue' && venueData) {
    return (
      <VenuePartnersScreen
        data={venueData}
        segment={segment}
        subView={subView}
        search={search}
        {...(profileId ? { profileId } : {})}
        pendingRequestId={pendingRequestId}
        pendingRequestAction={pendingRequestAction}
        requestErrorId={requestErrorId}
        requestError={requestError}
        connectingPartnerId={connectingPartnerId}
        connectErrorId={connectErrorId}
        connectError={connectError}
        onApproveRequest={handleApproveRequest}
        onRejectRequest={handleRejectRequest}
        onConnectPartner={handleConnectPartner}
        staffInvites={venueData.staffInvites ?? []}
        staffCanManage={venueData.staffAccess ? venueData.staffAccess.canManage : true}
        staffError={venueData.staffAccess?.error ?? null}
        revokingInviteId={revokingInviteId}
        revokeErrorId={revokeErrorId}
        revokeError={revokeError}
        onRevokeInvite={handleRevokeInvite}
        onStaffChanged={reload}
        studioCapability="venue"
      />
    );
  }

  if (studio === 'host' && hostData) {
    return (
      <HostPartnersScreen
        data={hostData}
        segment={segment}
        subView={subView}
        search={search}
        {...(profileId ? { profileId } : {})}
        pendingRequestId={pendingRequestId}
        pendingRequestAction={pendingRequestAction}
        requestErrorId={requestErrorId}
        requestError={requestError}
        connectingPartnerId={connectingPartnerId}
        connectErrorId={connectErrorId}
        connectError={connectError}
        onApproveRequest={handleApproveRequest}
        onRejectRequest={handleRejectRequest}
        onConnectPartner={handleConnectPartner}
        staffInvites={hostData.staffInvites ?? []}
        staffCanManage={hostData.staffAccess ? hostData.staffAccess.canManage : true}
        staffError={hostData.staffAccess?.error ?? null}
        revokingInviteId={revokingInviteId}
        revokeErrorId={revokeErrorId}
        revokeError={revokeError}
        onRevokeInvite={handleRevokeInvite}
        onStaffChanged={reload}
        studioCapability="host"
      />
    );
  }

  if (studio === 'promoter' && promoterData) {
    return (
      <PromoterPartnersScreen
        data={promoterData}
        tab={promoterTab}
        filter={promoterFilter}
        search={search}
        pendingRequestId={pendingRequestId}
        pendingRequestAction={pendingRequestAction}
        requestErrorId={requestErrorId}
        requestError={requestError}
        connectingPartnerId={connectingPartnerId}
        connectErrorId={connectErrorId}
        connectError={connectError}
        onApproveRequest={handleApproveRequest}
        onRejectRequest={handleRejectRequest}
        onConnectPartner={handleConnectPartner}
      />
    );
  }

  return null;
}
