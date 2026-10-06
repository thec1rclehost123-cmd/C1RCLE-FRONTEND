import Link from 'next/link';

import { Avatar } from '@/components/partner-v3/Avatar';
import { Badge } from '@/components/partner-v3/Badge';
import { Button } from '@/components/partner-v3/Button';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { SearchInput } from '@/components/partner-v3/SearchInput';
import { EmptyState } from '@/components/partner-v3/States';

import { PartnerCard } from './PartnerCard';
import { PartnerProfilePanel } from './PartnerProfilePanel';
import { PartnerRequestCard } from './PartnerRequestCard';
import styles from './partners.module.css';
import { AddStaffButton } from './PartnerStaffInviteDialog';

import type {
  PartnerRelationship,
  PartnerRelationshipSet,
  PartnerRequest,
  PartnerSegment,
  PartnerSubView,
  StaffInvite,
  StaffMember,
} from '@/data/partner-data-source';

export interface PartnerNetworkData {
  readonly primary: PartnerRelationshipSet;
  readonly promoters: PartnerRelationshipSet;
  readonly staff: readonly StaffMember[];
}

export interface PartnerRequestActions<TPartner> {
  readonly pendingRequestId?: string | null;
  readonly pendingRequestAction?: 'approve' | 'reject' | null;
  readonly requestErrorId?: string | null;
  readonly requestError?: string | null;
  readonly connectingPartnerId?: string | null;
  readonly connectErrorId?: string | null;
  readonly connectError?: string | null;
  readonly onApproveRequest?: ((request: PartnerRequest) => void) | undefined;
  readonly onRejectRequest?: ((request: PartnerRequest) => void) | undefined;
  readonly onConnectPartner?: ((partner: TPartner) => void) | undefined;
}

export interface PartnerNetworkScreenProps {
  readonly data: PartnerNetworkData;
  readonly baseHref: string;
  readonly primarySegment: 'hosts' | 'venues';
  readonly primaryLabel: 'Hosts' | 'Venues';
  readonly primarySubLabel: 'My partners' | 'My Venues';
  readonly segment?: PartnerSegment;
  readonly subView?: PartnerSubView;
  readonly search?: string;
  readonly profileId?: string;
  readonly showSearch?: boolean;
  readonly hostAccent?: boolean;
  /** Server-resolved org, handed to the request-card action islands. */
  readonly organizationId?: string;
  readonly pendingRequestId?: string | null;
  readonly pendingRequestAction?: 'approve' | 'reject' | null;
  readonly requestErrorId?: string | null;
  readonly requestError?: string | null;
  readonly connectingPartnerId?: string | null;
  readonly connectErrorId?: string | null;
  readonly connectError?: string | null;
  readonly onApproveRequest?: ((request: PartnerRequest) => void) | undefined;
  readonly onRejectRequest?: ((request: PartnerRequest) => void) | undefined;
  readonly onConnect?: ((partner: PartnerRelationship) => void) | undefined;
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

interface QueryState {
  readonly segment: PartnerSegment;
  readonly subView: PartnerSubView;
  readonly search: string;
  readonly profileId: string | undefined;
}

const filterBySearch = <T extends { readonly name: string }>(
  records: readonly T[],
  search: string,
) => {
  const normalized = search.trim().toLowerCase();
  return normalized
    ? records.filter((record) => record.name.toLowerCase().includes(normalized))
    : records;
};

const relationshipRecords = (
  data: PartnerNetworkData,
  segment: 'hosts' | 'venues' | 'promoters',
  subView: PartnerSubView,
): readonly PartnerRelationship[] =>
  data[segment === 'promoters' ? 'promoters' : 'primary'][
    subView === 'connected' ? 'connected' : 'discover'
  ];

function staffChips(member: StaffMember): readonly string[] {
  if (member.capabilities && member.capabilities.length > 0) {
    return member.backendRole ? [member.backendRole, ...member.capabilities] : [...member.capabilities];
  }
  return member.permissions;
}

function StaffList({
  staff,
  invites,
  search,
  canManage,
  staffError,
  revokingInviteId,
  revokeErrorId,
  revokeError,
  onRevokeInvite,
}: {
  readonly staff: readonly StaffMember[];
  readonly invites: readonly StaffInvite[];
  readonly search: string;
  readonly canManage: boolean;
  readonly staffError: string | null;
  readonly revokingInviteId: string | null;
  readonly revokeErrorId: string | null;
  readonly revokeError: string | null;
  readonly onRevokeInvite?: ((invite: StaffInvite) => void) | undefined;
}) {
  const normalized = search.trim().toLowerCase();
  const members = filterBySearch(staff, search);
  const pendingInvites = invites.filter(
    (invite) =>
      invite.status === 'pending' &&
      (!normalized || invite.email.toLowerCase().includes(normalized)),
  );

  if (staffError) {
    return <EmptyState title="Couldn't load staff" description={staffError} />;
  }

  if (staff.length === 0 && pendingInvites.length === 0) {
    return (
      <EmptyState
        title="No staff yet"
        description="Invite your team by email — they appear here once they accept."
      />
    );
  }

  if (normalized && members.length === 0 && pendingInvites.length === 0) {
    return <EmptyState title="No staff found" description="Try a different name or clear the search." />;
  }

  return (
    <div className={styles['staffSection']}>
      {pendingInvites.length > 0 ? (
        <section>
          <h2 className={styles['requestSectionHeading']}>Pending invites</h2>
          <div className={styles['requestList']}>
            {pendingInvites.map((invite) => (
              <article className={styles['requestCard']} key={invite.id}>
                <div className={styles['partnerIdentity']}>
                  <Avatar name={invite.email} />
                  <div>
                    <div className={styles['requestNameRow']}>
                      <h3>{invite.email}</h3>
                      <Badge tone="neutral">Invite sent</Badge>
                    </div>
                    <p>
                      {invite.role}
                      {invite.capabilities.length > 0 ? ` · ${invite.capabilities.join(', ')}` : ''}
                    </p>
                    {revokeErrorId === invite.id && revokeError ? <p role="alert">{revokeError}</p> : null}
                  </div>
                </div>
                {canManage && onRevokeInvite ? (
                  <div className={styles['requestActions']}>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={revokingInviteId === invite.id}
                      onClick={() => {
                        onRevokeInvite(invite);
                      }}
                    >
                      {revokingInviteId === invite.id ? 'Revoking…' : 'Revoke'}
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {members.length > 0 ? (
        <div className={styles['staffGrid']}>
          {members.map((member) => (
            <article className={styles['staffCard']} key={member.id}>
              <div className={styles['staffCardHeader']}>
                <div className={styles['partnerIdentity']}>
                  <Avatar name={member.name} />
                  <div>
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                  </div>
                </div>
                <Badge tone="success">{member.status}</Badge>
              </div>
              <div className={styles['permissionChips']}>
                {staffChips(member).map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
              {member.email ? <p>{member.email}</p> : null}
            </article>
          ))}
        </div>
      ) : normalized ? (
        <EmptyState title="No staff found" description="Try a different name or clear the search." />
      ) : null}
      {!canManage ? (
        <p className={styles['dialogNotice']}>
          Only team members with staff-management access can invite or revoke staff.
        </p>
      ) : null}
    </div>
  );
}

export function PartnerNetworkScreen({
  data,
  baseHref,
  primarySegment,
  primaryLabel,
  primarySubLabel,
  segment = primarySegment,
  subView = 'connected',
  search = '',
  profileId,
  showSearch = true,
  hostAccent = false,
  organizationId,
  pendingRequestId = null,
  pendingRequestAction = null,
  requestErrorId = null,
  requestError = null,
  connectingPartnerId = null,
  connectErrorId = null,
  connectError = null,
  onApproveRequest,
  onRejectRequest,
  onConnect,
  staffInvites = [],
  staffCanManage = true,
  staffError = null,
  revokingInviteId = null,
  revokeErrorId = null,
  revokeError = null,
  onRevokeInvite,
  onStaffChanged,
  studioCapability,
}: PartnerNetworkScreenProps) {
  const state: QueryState = { segment, subView, search, profileId };
  const partnerSet =
    segment === 'staff' ? null : segment === primarySegment ? data.primary : data.promoters;
  const records =
    segment === 'hosts' || segment === 'venues' || segment === 'promoters'
      ? filterBySearch(relationshipRecords(data, segment, subView), search)
      : [];
  const requests =
    partnerSet && subView === 'requests'
      ? [
          ...filterBySearch(partnerSet.requests.incoming, search),
          ...filterBySearch(partnerSet.requests.outgoing, search),
        ]
      : [];
  const profile = partnerSet
    ? [...partnerSet.connected, ...partnerSet.discover].find((item) => item.id === profileId)
    : undefined;
  const rootClass = hostAccent ? styles['hostPartners'] : '';
  const hrefFor = (overrides: Partial<QueryState> = {}) => {
    const next = { ...state, ...overrides };
    const params = new URLSearchParams();
    if (next.segment !== primarySegment) params.set('tab', next.segment);
    if (next.segment !== 'staff' && next.subView !== 'connected') params.set('view', next.subView);
    if (next.search) params.set('search', next.search);
    if (next.profileId) params.set('profile', next.profileId);
    const query = params.toString();
    return `${baseHref}${query ? `?${query}` : ''}`;
  };
  const segmentItems = [
    { value: primarySegment, label: primaryLabel },
    { value: 'promoters' as const, label: 'Promoters' },
    { value: 'staff' as const, label: 'Staff' },
  ];
  const subViewItems = [
    { value: 'connected' as const, label: primarySubLabel },
    { value: 'discover' as const, label: 'Discover' },
    { value: 'requests' as const, label: 'Requests' },
  ];

  return (
    <PageContainer>
      <div className={rootClass}>
        <header className={styles['partnersHeader']}>
          <div>
            <span className={styles['sectionKicker']}>Network</span>
            <h1>Partners</h1>
            <p>The venues, promoters &amp; staff you run nights with.</p>
          </div>
          {segment === 'staff' ? (
            <AddStaffButton
              {...(hostAccent ? { buttonClassName: styles['hostPrimaryButton'] } : {})}
              {...(studioCapability ? { defaultCapability: studioCapability } : {})}
              {...(onStaffChanged ? { onInvited: onStaffChanged } : {})}
              disabled={!staffCanManage}
              disabledTitle="You need staff-management access to invite staff"
            />
          ) : null}
        </header>
        <nav className={styles['segmentTabs']} aria-label="Partner type">
          {segmentItems.map((item) => (
            <Link
              key={item.value}
              href={hrefFor({ segment: item.value, subView: 'connected', profileId: undefined })}
              className={segment === item.value ? styles['segmentTabActive'] : ''}
              aria-current={segment === item.value ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {segment !== 'staff' ? (
          <nav className={styles['subTabs']} aria-label={`${segment} partner views`}>
            {subViewItems.map((item) => (
              <Link
                key={item.value}
                href={hrefFor({ subView: item.value, profileId: undefined })}
                className={subView === item.value ? styles['subTabActive'] : ''}
                aria-current={subView === item.value ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
        {showSearch ? (
          <form className={styles['partnerToolbar']} action={baseHref} method="get">
            <input type="hidden" name="tab" value={segment} />
            {segment !== 'staff' ? <input type="hidden" name="view" value={subView} /> : null}
            <SearchInput
              name="search"
              defaultValue={search}
              placeholder={segment === 'staff' ? 'Search staff' : 'Search partners'}
              aria-label={segment === 'staff' ? 'Search staff' : 'Search partners'}
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {search ? (
              <Link
                className={styles['clearSearch']}
                href={hrefFor({ search: '', profileId: undefined })}
              >
                Clear
              </Link>
            ) : null}
          </form>
        ) : null}
        {subView === 'requests' && segment !== 'staff' ? (
          requests.length ? (
            <div className={styles['requestList']}>
              {requests.map((request) => (
                <PartnerRequestCard
                  key={`${request.direction}-${request.id}`}
                  request={request}
                  hostAccent={hostAccent}
                  pendingRequestId={pendingRequestId ?? null}
                  pendingRequestAction={pendingRequestAction ?? null}
                  requestErrorId={requestErrorId ?? null}
                  requestError={requestError ?? null}
                  onApproveRequest={onApproveRequest}
                  onRejectRequest={onRejectRequest}
                  {...(organizationId ? { organizationId } : {})}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No requests found"
              description="Incoming and outgoing partner requests will appear here."
            />
          )
        ) : segment === 'staff' ? (
          <StaffList
            staff={data.staff}
            invites={staffInvites}
            search={search}
            canManage={staffCanManage}
            staffError={staffError}
            revokingInviteId={revokingInviteId}
            revokeErrorId={revokeErrorId}
            revokeError={revokeError}
            {...(onRevokeInvite ? { onRevokeInvite } : {})}
          />
        ) : records.length ? (
          <div className={styles['partnerGrid']}>
            {records.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                href={hrefFor({ profileId: partner.id })}
                hostAccent={hostAccent}
                connecting={connectingPartnerId === partner.id}
                connectError={connectErrorId === partner.id ? (connectError ?? null) : null}
                onConnect={onConnect}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No partners found"
            description="Try a different search or explore the discover view."
            action={
              <Link
                className={styles['emptyLink']}
                href={hrefFor({ search: '', subView: 'discover', profileId: undefined })}
              >
                Browse discover
              </Link>
            }
          />
        )}
        {profile ? (
          <PartnerProfilePanel
            partner={profile}
            closeHref={hrefFor({ profileId: undefined })}
            {...(hostAccent ? { primaryButtonClassName: styles['hostPrimaryButton'] } : {})}
            hostAccent={hostAccent}
            connecting={connectingPartnerId === profile.id}
            connectError={connectErrorId === profile.id ? (connectError ?? null) : null}
            onConnect={onConnect}
          />
        ) : null}
      </div>
    </PageContainer>
  );
}
