/**
 * api-partner-data-source.ts
 *
 * Provides getVenuePartnersFromApi, getHostPartnersFromApi, and
 * getPromoterPartnersFromApi backed by the v2 backend API.
 *
 * - Connected + Requests come from `partnerships` + `promoter-connections`.
 * - Discover comes from `GET /organizations/:id/discover-partners` (real
 *   backend organizations/venues — never dummy profiles; empty DB renders
 *   empty states).
 * - Display names prefer the backend-enriched `hostName` / `venueName` /
 *   `promoterName` / `targetName` fields. Only when the backend has no name
 *   (e.g. a deleted org) do we fall back to an ID-derived label rather than
 *   a fabricated person name.
 */

import { partnershipApi, promoterConnectionApi } from '@/lib/api/partner-connections';
import { fetchDiscoverPartners } from '@/lib/api/partner-discover';
import { getActiveOrgId } from '@/lib/org/active-org';

import type {
  HostPartnersData,
  PartnerCardTone,
  PartnerRelationship,
  PartnerRelationshipSet,
  PartnerRequest,
  PromoterPartnerRecord,
  PromoterPartnersData,
  StaffMember,
  VenuePartnersData,
} from './partner-data-source';
import type { PartnershipDto, PromoterConnectionDto } from '@/lib/api/partner-connections';
import type { DiscoverPartnerDto } from '@c1rcle/contracts/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TONES: PartnerCardTone[] = ['violet', 'teal', 'pink', 'gold', 'indigo', 'orange', 'slate'];

function pickTone(index: number): PartnerCardTone {
  return TONES[index % TONES.length] ?? 'violet';
}

function generateInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Returns the active org ID from the `c1rcle.active-org` cookie.
 * Client-side only — server components must not call these fetchers directly;
 * render a client component that calls them after hydration instead.
 */
function getOrgId(): string {
  const id = getActiveOrgId();
  if (!id) throw new Error('No active organization selected');
  return id;
}

/** No staff data is returned by the v2 API yet. */
const emptyStaff: readonly StaffMember[] = [];

function partnershipDisplayName(
  p: PartnershipDto,
  side: 'venue' | 'host',
): { name: string; city: string | null; verified: boolean } {
  if (side === 'venue') {
    if (p.hostName) return { name: p.hostName, city: null, verified: true };
    return { name: `Host ${p.hostOrganizationId.slice(-6).toUpperCase()}`, city: null, verified: false };
  }
  if (p.venueName) return { name: p.venueName, city: p.venueCity ?? '—', verified: true };
  return { name: `Venue ${p.venueId.slice(-6).toUpperCase()}`, city: null, verified: false };
}

function connectionDisplayName(c: PromoterConnectionDto): {
  name: string;
  city: string | null;
  verified: boolean;
} {
  // From a venue/host dashboard the counterparty is the promoter.
  if (c.promoterName) return { name: c.promoterName, city: null, verified: true };
  return { name: `Promoter ${c.promoterId.slice(-6).toUpperCase()}`, city: null, verified: false };
}

function promoterTargetDisplayName(c: PromoterConnectionDto): {
  name: string;
  city: string | null;
  verified: boolean;
} {
  // From the promoter dashboard the counterparty is the venue/host target.
  if (c.targetName)
    return { name: c.targetName, city: c.targetCity ?? '—', verified: true };
  const fallback =
    c.targetType === 'venue'
      ? `Venue ${c.targetId.slice(-6).toUpperCase()}`
      : `Host ${c.targetId.slice(-6).toUpperCase()}`;
  return { name: fallback, city: null, verified: false };
}

// ── Partnership (venue <-> host) mappers ─────────────────────────────────────

/**
 * Maps a PartnershipDto to a PartnerRelationship for the venue dashboard.
 * From the venue's perspective the counterparty is always the host org.
 */
function partnershipToVenueRelationship(p: PartnershipDto, index: number): PartnerRelationship {
  const display = partnershipDisplayName(p, 'venue');
  return {
    id: p.id,
    name: display.name,
    initials: generateInitials(display.name),
    kind: 'host',
    role: 'Host Organisation',
    location: display.city ?? '—',
    genres: [],
    stats: [],
    upcomingEvents: [],
    verified: display.verified,
    cardTone: pickTone(index),
    status: 'Partnered',
    organizationId: p.hostOrganizationId,
    venueId: p.venueId,
  };
}

/**
 * Maps a PartnershipDto to a PartnerRelationship for the host dashboard.
 * From the host's perspective the counterparty is always the venue.
 */
function partnershipToHostRelationship(p: PartnershipDto, index: number): PartnerRelationship {
  const display = partnershipDisplayName(p, 'host');
  return {
    id: p.id,
    name: display.name,
    initials: generateInitials(display.name),
    kind: 'venue',
    role: 'Venue',
    location: display.city ?? '—',
    genres: [],
    stats: [],
    upcomingEvents: [],
    verified: display.verified,
    cardTone: pickTone(index),
    status: 'Partnered',
    organizationId: p.venueOrganizationId,
    venueId: p.venueId,
  };
}

/**
 * Maps a non-active PartnershipDto to a PartnerRequest for the venue Requests tab.
 * 'venue' initiated → outgoing; 'host' initiated → incoming.
 */
function partnershipToVenueRequest(p: PartnershipDto): PartnerRequest {
  const display = partnershipDisplayName(p, 'venue');
  return {
    id: p.id,
    name: display.name,
    initials: generateInitials(display.name),
    kind: 'host',
    direction: p.initiatedBy === 'venue' ? 'outgoing' : 'incoming',
    note: p.message ?? '',
  };
}

/**
 * Maps a non-active PartnershipDto to a PartnerRequest for the host Requests tab.
 * 'host' initiated → outgoing; 'venue' initiated → incoming.
 */
function partnershipToHostRequest(p: PartnershipDto): PartnerRequest {
  const display = partnershipDisplayName(p, 'host');
  return {
    id: p.id,
    name: display.name,
    initials: generateInitials(display.name),
    kind: 'venue',
    direction: p.initiatedBy === 'host' ? 'outgoing' : 'incoming',
    note: p.message ?? '',
  };
}

// ── PromoterConnection mappers ────────────────────────────────────────────────

/**
 * Maps an active PromoterConnectionDto to a PartnerRelationship for the
 * promoters section of the venue or host dashboard.
 */
function promoterConnectionToRelationship(c: PromoterConnectionDto, index: number): PartnerRelationship {
  const display = connectionDisplayName(c);
  return {
    id: c.id,
    name: display.name,
    initials: generateInitials(display.name),
    kind: 'promoter',
    role: 'Promoter',
    location: display.city ?? '—',
    genres: [],
    stats: [],
    upcomingEvents: [],
    verified: display.verified,
    cardTone: pickTone(index),
    status: 'Partnered',
    organizationId: c.promoterId,
    venueId: null,
  };
}

/**
 * Maps a non-active PromoterConnectionDto to a PartnerRequest.
 * 'target' (venue/host) initiated → outgoing; 'promoter' initiated → incoming.
 */
function promoterConnectionToRequest(c: PromoterConnectionDto): PartnerRequest {
  const display = connectionDisplayName(c);
  return {
    id: c.id,
    name: display.name,
    initials: generateInitials(display.name),
    kind: 'promoter',
    direction: c.initiatedBy === 'target' ? 'outgoing' : 'incoming',
    note: c.message ?? '',
  };
}

/**
 * Maps a PromoterConnectionDto to a PromoterPartnerRecord for the promoter
 * dashboard's Active / Discover tabs.
 */
function connectionToPromoterRecord(c: PromoterConnectionDto, index: number): PromoterPartnerRecord {
  const isVenue = c.targetType === 'venue';
  const display = promoterTargetDisplayName(c);
  return {
    id: c.id,
    name: display.name,
    initials: generateInitials(display.name),
    kind: isVenue ? 'venue' : 'host',
    role: isVenue ? 'Venue' : 'Host Organisation',
    location: display.city ?? '—',
    genres: [],
    stats: [],
    upcomingEvents: [],
    verified: display.verified,
    cardTone: pickTone(index),
    state: c.status === 'active' ? 'active' : 'discover',
    actionLabel: c.status === 'active' ? 'Connected' : 'Send Request',
    organizationId: c.targetId,
    venueId: null,
  };
}

// ── Discover (real backend browse) ────────────────────────────────────────────

function discoverToRelationship(d: DiscoverPartnerDto, index: number): PartnerRelationship {
  const kind = d.kind === 'venue' ? 'venue' : d.kind === 'host' ? 'host' : 'promoter';
  const role = d.kind === 'venue' ? 'Venue' : d.kind === 'host' ? 'Host Organisation' : 'Promoter';
  return {
    id: d.id,
    name: d.name,
    initials: generateInitials(d.name),
    kind,
    role,
    location: d.city ?? '—',
    genres: [],
    stats: [],
    upcomingEvents: [],
    verified: d.verified,
    cardTone: pickTone(index),
    status: undefined,
    organizationId: d.organizationId,
    venueId: d.venueId,
  };
}

function discoverToPromoterRecord(d: DiscoverPartnerDto, index: number): PromoterPartnerRecord {
  const isVenue = d.kind === 'venue';
  return {
    id: d.id,
    name: d.name,
    initials: generateInitials(d.name),
    kind: isVenue ? 'venue' : 'host',
    role: isVenue ? 'Venue' : 'Host Organisation',
    location: d.city ?? '—',
    genres: [],
    stats: [],
    upcomingEvents: [],
    verified: d.verified,
    cardTone: pickTone(index),
    state: 'discover',
    actionLabel: 'Send Request',
    organizationId: d.organizationId,
    venueId: d.venueId,
  };
}

async function fetchDiscoverSet(kinds: readonly ('host' | 'venue' | 'promoter')[]) {
  const settled = await Promise.allSettled(kinds.map((type) => fetchDiscoverPartners({ type })));
  const items: DiscoverPartnerDto[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') items.push(...result.value);
  }
  // De-dupe by id (host+promoter queries can overlap).
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetches all venue partnerships + promoter connections for the venue dashboard
 * Partners page and maps them into VenuePartnersData. Discover is real backend
 * data (organizations/venues), never dummy profiles.
 */
export async function getVenuePartnersFromApi(search?: string): Promise<VenuePartnersData> {
  const orgId = getOrgId();

  const [{ items: partnershipItems }, { items: connectionItems }] = await Promise.all([
    partnershipApi.list(orgId),
    promoterConnectionApi.list(orgId),
  ]);

  const activePartnerships = partnershipItems.filter((p) => p.status === 'active');
  // Requests tabs show only actionable pending rows. Resolved rows
  // (rejected/blocked/ended) must not linger here: they are not answerable,
  // and re-clicking Accept/Reject on them 409s, which reads as "accept is
  // broken". Active rows live in Connected.
  const pendingPartnerships = partnershipItems.filter((p) => p.status === 'pending');

  const activeConnections = connectionItems.filter((c) => c.status === 'active');
  const pendingConnections = connectionItems.filter((c) => c.status === 'pending');

  const discoverItems = await fetchDiscoverSet(['host', 'promoter']);
  const discoverHosts = discoverItems.filter((d) => d.kind === 'host');
  const discoverPromoters = discoverItems.filter((d) => d.kind !== 'host');

  const hostSet: PartnerRelationshipSet = {
    connected: activePartnerships.map(partnershipToVenueRelationship),
    discover: discoverHosts.map(discoverToRelationship),
    requests: {
      incoming: pendingPartnerships
        .filter((p) => p.initiatedBy !== 'venue')
        .map(partnershipToVenueRequest),
      outgoing: pendingPartnerships
        .filter((p) => p.initiatedBy === 'venue')
        .map(partnershipToVenueRequest),
    },
  };

  const promoterSet: PartnerRelationshipSet = {
    connected: activeConnections.map(promoterConnectionToRelationship),
    discover: discoverPromoters.map(discoverToRelationship),
    requests: {
      incoming: pendingConnections
        .filter((c) => c.initiatedBy !== 'target')
        .map(promoterConnectionToRequest),
      outgoing: pendingConnections
        .filter((c) => c.initiatedBy === 'target')
        .map(promoterConnectionToRequest),
    },
  };

  void search;

  return {
    dataStatus: 'api',
    hosts: hostSet,
    promoters: promoterSet,
    staff: emptyStaff,
  };
}

/**
 * Fetches all venue partnerships + promoter connections for the host dashboard
 * Partners page and maps them into HostPartnersData.
 */
export async function getHostPartnersFromApi(search?: string): Promise<HostPartnersData> {
  const orgId = getOrgId();

  const [{ items: partnershipItems }, { items: connectionItems }] = await Promise.all([
    partnershipApi.list(orgId),
    promoterConnectionApi.list(orgId),
  ]);

  const activePartnerships = partnershipItems.filter((p) => p.status === 'active');
  // Same pending-only rule as the venue dashboard (see above).
  const pendingPartnerships = partnershipItems.filter((p) => p.status === 'pending');

  const activeConnections = connectionItems.filter((c) => c.status === 'active');
  const pendingConnections = connectionItems.filter((c) => c.status === 'pending');

  const discoverItems = await fetchDiscoverSet(['venue', 'promoter']);
  const discoverVenues = discoverItems.filter((d) => d.kind === 'venue');
  const discoverPromoters = discoverItems.filter((d) => d.kind !== 'venue');

  const venueSet: PartnerRelationshipSet = {
    connected: activePartnerships.map(partnershipToHostRelationship),
    discover: discoverVenues.map(discoverToRelationship),
    requests: {
      incoming: pendingPartnerships
        .filter((p) => p.initiatedBy !== 'host')
        .map(partnershipToHostRequest),
      outgoing: pendingPartnerships
        .filter((p) => p.initiatedBy === 'host')
        .map(partnershipToHostRequest),
    },
  };

  const promoterSet: PartnerRelationshipSet = {
    connected: activeConnections.map(promoterConnectionToRelationship),
    discover: discoverPromoters.map(discoverToRelationship),
    requests: {
      incoming: pendingConnections
        .filter((c) => c.initiatedBy !== 'target')
        .map(promoterConnectionToRequest),
      outgoing: pendingConnections
        .filter((c) => c.initiatedBy === 'target')
        .map(promoterConnectionToRequest),
    },
  };

  void search;

  return {
    dataStatus: 'api',
    venues: venueSet,
    promoters: promoterSet,
    staff: emptyStaff,
  };
}

/**
 * Fetches all promoter connections for the promoter dashboard Partners page
 * and maps them into PromoterPartnersData.
 *
 * active     → Active tab
 * pending    → Incoming / Pending tabs (split by initiatedBy direction)
 * rejected/blocked/revoked → Declined tab
 * discover   → real backend venues/hosts browse
 */
export async function getPromoterPartnersFromApi(search?: string): Promise<PromoterPartnersData> {
  const orgId = getOrgId();

  const { items } = await promoterConnectionApi.list(orgId);

  const activeItems = items.filter((c) => c.status === 'active');
  const pendingItems = items.filter((c) => c.status === 'pending');
  const declinedItems = items.filter(
    (c) => c.status === 'rejected' || c.status === 'blocked' || c.status === 'revoked',
  );

  /** Incoming: target initiated the request and the promoter hasn't answered */
  const incomingRequests: PartnerRequest[] = pendingItems
    .filter((c) => c.initiatedBy !== 'promoter')
    .map((c) => {
      const display = promoterTargetDisplayName(c);
      const isVenue = c.targetType === 'venue';
      return {
        id: c.id,
        name: display.name,
        initials: generateInitials(display.name),
        kind: isVenue ? ('venue' as const) : ('host' as const),
        direction: 'incoming' as const,
        note: c.message ?? '',
      };
    });

  /** Pending outgoing: promoter sent the request, waiting for the other side */
  const pendingRequests: PartnerRequest[] = pendingItems
    .filter((c) => c.initiatedBy === 'promoter')
    .map((c) => {
      const display = promoterTargetDisplayName(c);
      const isVenue = c.targetType === 'venue';
      return {
        id: c.id,
        name: display.name,
        initials: generateInitials(display.name),
        kind: isVenue ? ('venue' as const) : ('host' as const),
        direction: 'outgoing' as const,
        note: c.message ?? '',
      };
    });

  const declinedRequests: PartnerRequest[] = declinedItems.map((c) => {
    const display = promoterTargetDisplayName(c);
    const isVenue = c.targetType === 'venue';
    return {
      id: c.id,
      name: display.name,
      initials: generateInitials(display.name),
      kind: isVenue ? ('venue' as const) : ('host' as const),
      direction: c.initiatedBy === 'promoter' ? ('outgoing' as const) : ('incoming' as const),
      note: c.message ?? '',
    };
  });

  const venuesCount = activeItems.filter((c) => c.targetType === 'venue').length;
  const hostsCount = activeItems.filter((c) => c.targetType === 'host').length;

  const discoverItems = await fetchDiscoverSet(['venue', 'host']);

  void search;

  return {
    dataStatus: 'api',
    activePartnersCount: activeItems.length,
    pendingPartnersCount: pendingItems.length,
    venuesCount,
    hostsCount,
    active: activeItems.map(connectionToPromoterRecord),
    discover: discoverItems.map(discoverToPromoterRecord),
    incoming: incomingRequests,
    pending: pendingRequests,
    declined: declinedRequests,
  };
}
