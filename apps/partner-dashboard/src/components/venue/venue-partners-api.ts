import { partnershipApi, promoterConnectionApi } from '@/lib/api/partner-connections';
import { fetchDiscoverPartners, fetchOwnVenues } from '@/lib/api/partner-discover';
import { getActiveOrgId } from '@/lib/org/active-org';

import type { PartnershipDto, PromoterConnectionDto } from '@/lib/api/partner-connections';

export type VenuePartnerKind = 'host' | 'promoter';

export interface VenuePartner {
  readonly id: string;
  readonly kind: VenuePartnerKind;
  readonly name: string;
  readonly initials: string;
  readonly city: string;
  readonly recentEvent: string;
  readonly recentEventDate: string;
  readonly status: 'Active' | 'Invite pending';
  readonly phone: string | null;
  readonly instagram: string | null;
  readonly verified: boolean;
  readonly tone: 'violet' | 'red' | 'blue' | 'amber' | 'rose' | 'green';
  readonly credibility: {
    readonly trackedEvents: number;
    readonly performanceValue: number;
    readonly rebookRate: number;
  };
  readonly eventHistory: readonly {
    readonly id: string;
    readonly name: string;
    readonly date: string;
    readonly outcome: string;
  }[];
  readonly eventType: string | null;
  readonly experienceYears: number;
  readonly avgTicketsSold: number | null;
  readonly avgAttendance: number | null;
  readonly capacity: number | null;
  readonly venuesWorkedWith: number | null;
  readonly upcomingEvents: readonly { readonly id: string; readonly name: string; readonly date: string }[] | null;
  readonly audienceReach: number | null;
  readonly conversionRate: number | null;
  readonly activeAccepting: boolean;
}

export interface DiscoverablePartner extends VenuePartner {
  readonly genre: string;
}

export type PartnershipRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type PartnershipRequestDirection = 'received' | 'sent';

export interface VenuePartnershipRequest {
  readonly id: string;
  readonly kind: VenuePartnerKind;
  readonly direction: PartnershipRequestDirection;
  readonly partnerName: string;
  readonly partnerInitials: string;
  readonly partnerCity: string;
  readonly tone: VenuePartner['tone'];
  readonly verified: boolean;
  readonly status: PartnershipRequestStatus;
  readonly requestedAt: string;
  readonly note: string | null;
}

const TONES: VenuePartner['tone'][] = ['violet', 'red', 'blue', 'amber', 'rose', 'green'];

function getTone(index: number): VenuePartner['tone'] {
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
 * Formats an ISO datetime string into a human-readable date.
 * Falls back to the raw string if parsing fails.
 */
function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Maps a PartnershipDto from the backend to a VenuePartner display object.
 * Fields not yet exposed by the backend (name, city, phone, etc.) are shown
 * as null / "—" rather than fabricated dummy data.
 */
function mapPartnershipToVenuePartner(p: PartnershipDto, index: number): VenuePartner {
  const partnerLabel = p.hostName ?? `Host ${p.hostOrganizationId.slice(-6).toUpperCase()}`;
  return {
    id: p.id,
    kind: 'host',
    name: partnerLabel,
    initials: generateInitials(partnerLabel),
    city: '—',
    recentEvent: '—',
    recentEventDate: formatDate(p.updatedAt),
    status: p.status === 'active' ? 'Active' : 'Invite pending',
    phone: null,
    instagram: null,
    verified: false,
    tone: getTone(index),
    credibility: {
      trackedEvents: 0,
      performanceValue: 0,
      rebookRate: 0,
    },
    eventHistory: [],
    eventType: null,
    experienceYears: 0,
    avgTicketsSold: null,
    avgAttendance: null,
    capacity: null,
    venuesWorkedWith: null,
    upcomingEvents: null,
    audienceReach: null,
    conversionRate: null,
    activeAccepting: p.status === 'active',
  };
}

/**
 * Maps a PromoterConnectionDto from the backend to a VenuePartner display object.
 * Fields not yet exposed by the backend are shown as null / "—".
 */
function mapPromoterConnectionToVenuePartner(c: PromoterConnectionDto, index: number): VenuePartner {
  const partnerLabel = c.promoterName ?? `Promoter ${c.promoterId.slice(-6).toUpperCase()}`;
  return {
    id: c.id,
    kind: 'promoter',
    name: partnerLabel,
    initials: generateInitials(partnerLabel),
    city: '—',
    recentEvent: '—',
    recentEventDate: formatDate(c.updatedAt),
    status: c.status === 'active' ? 'Active' : 'Invite pending',
    phone: null,
    instagram: null,
    verified: false,
    tone: getTone(index),
    credibility: {
      trackedEvents: 0,
      performanceValue: 0,
      rebookRate: 0,
    },
    eventHistory: [],
    eventType: null,
    experienceYears: 0,
    avgTicketsSold: null,
    avgAttendance: null,
    capacity: null,
    venuesWorkedWith: null,
    upcomingEvents: null,
    audienceReach: null,
    conversionRate: null,
    activeAccepting: c.status === 'active',
  };
}

/**
 * Maps a PartnershipDto to a VenuePartnershipRequest for the Requests tab.
 * Direction:
 *   - 'venue' initiated → 'sent' (venue sent the request)
 *   - 'host'  initiated → 'received' (host sent, venue received)
 */
function mapPartnershipToRequest(p: PartnershipDto, index: number): VenuePartnershipRequest {
  const direction: PartnershipRequestDirection = p.initiatedBy === 'venue' ? 'sent' : 'received';
  const partnerLabel = p.hostName ?? `Host ${p.hostOrganizationId.slice(-6).toUpperCase()}`;
  const statusMap: Record<string, PartnershipRequestStatus> = {
    pending: 'pending',
    active: 'accepted',
    rejected: 'declined',
    blocked: 'declined',
    ended: 'cancelled',
  };
  return {
    id: p.id,
    kind: 'host',
    direction,
    partnerName: partnerLabel,
    partnerInitials: generateInitials(partnerLabel),
    partnerCity: '—',
    tone: getTone(index),
    verified: false,
    status: statusMap[p.status] ?? 'pending',
    requestedAt: formatDate(p.createdAt),
    note: p.message,
  };
}

/**
 * Maps a PromoterConnectionDto to a VenuePartnershipRequest for the Requests tab.
 * Direction:
 *   - 'target'   initiated → 'sent' (venue/target sent the request)
 *   - 'promoter' initiated → 'received' (promoter sent, venue received)
 */
function mapPromoterConnectionToRequest(c: PromoterConnectionDto, index: number): VenuePartnershipRequest {
  const direction: PartnershipRequestDirection = c.initiatedBy === 'target' ? 'sent' : 'received';
  const partnerLabel = c.promoterName ?? `Promoter ${c.promoterId.slice(-6).toUpperCase()}`;
  const statusMap: Record<string, PartnershipRequestStatus> = {
    pending: 'pending',
    active: 'accepted',
    rejected: 'declined',
    blocked: 'declined',
    revoked: 'cancelled',
  };
  return {
    id: c.id,
    kind: 'promoter',
    direction,
    partnerName: partnerLabel,
    partnerInitials: generateInitials(partnerLabel),
    partnerCity: '—',
    tone: getTone(index),
    verified: false,
    status: statusMap[c.status] ?? 'pending',
    requestedAt: formatDate(c.createdAt),
    note: c.message,
  };
}

// ── In-memory cache ──────────────────────────────────────────────────────────

let hostPartnersCache: VenuePartner[] | null = null;
let promoterPartnersCache: VenuePartner[] | null = null;
let discoverableHostsCache: DiscoverablePartner[] | null = null;
let discoverablePromotersCache: DiscoverablePartner[] | null = null;
let partnershipRequestsCache: VenuePartnershipRequest[] | null = null;

/**
 * Backend-only partner fetcher. Every row is mapped from the `partnerships`
 * and `promoter-connections` backend collections; unknown profile fields are
 * "—"/null rather than fabricated dummy data, and there is no fixture import.
 */
export async function fetchVenuePartners(kind: VenuePartnerKind): Promise<VenuePartner[]> {
  const orgId = getActiveOrgId();
  if (!orgId) return [];

  if (kind === 'host') {
    if (hostPartnersCache) return hostPartnersCache;
    const { items } = await partnershipApi.list(orgId);
    // Only active partnerships appear in the "Connected" tab.
    hostPartnersCache = items
      .filter((p) => p.status === 'active')
      .map(mapPartnershipToVenuePartner);
    return hostPartnersCache;
  } else {
    if (promoterPartnersCache) return promoterPartnersCache;
    const { items } = await promoterConnectionApi.list(orgId);
    // Only active connections appear in the "Connected" tab.
    promoterPartnersCache = items
      .filter((c) => c.status === 'active')
      .map(mapPromoterConnectionToVenuePartner);
    return promoterPartnersCache;
  }
}

function discoverToVenuePartner(
  kind: VenuePartnerKind,
  item: { id: string; name: string; slug: string; city: string | null; organizationId: string | null; venueId: string | null },
  index: number,
): DiscoverablePartner {
  const initials = generateInitials(item.name);
  return {
    id: item.organizationId ?? item.id,
    kind,
    name: item.name,
    initials,
    city: item.city ?? '—',
    recentEvent: '—',
    recentEventDate: '—',
    status: 'Invite pending',
    phone: null,
    instagram: null,
    verified: true,
    tone: getTone(index),
    credibility: { trackedEvents: 0, performanceValue: 0, rebookRate: 0 },
    eventHistory: [],
    eventType: null,
    experienceYears: 0,
    avgTicketsSold: null,
    avgAttendance: null,
    capacity: null,
    venuesWorkedWith: null,
    upcomingEvents: null,
    audienceReach: null,
    conversionRate: null,
    activeAccepting: true,
    genre: kind === 'host' ? 'Host' : 'Promoter',
  };
}

export async function fetchDiscoverablePartners(kind: VenuePartnerKind): Promise<DiscoverablePartner[]> {
  // Real backend browse — never dummy profiles. Empty DB yields empty lists.
  if (kind === 'host') {
    if (discoverableHostsCache) return discoverableHostsCache;
    try {
      const items = await fetchDiscoverPartners({ type: 'host' });
      discoverableHostsCache = items.map((item, index) => discoverToVenuePartner('host', item, index));
    } catch {
      discoverableHostsCache = [];
    }
    return discoverableHostsCache;
  }
  if (discoverablePromotersCache) return discoverablePromotersCache;
  try {
    const items = await fetchDiscoverPartners({ type: 'promoter' });
    discoverablePromotersCache = items.map((item, index) =>
      discoverToVenuePartner('promoter', item, index),
    );
  } catch {
    discoverablePromotersCache = [];
  }
  return discoverablePromotersCache;
}

export async function fetchOwnVenueId(): Promise<string | null> {
  try {
    const venues = await fetchOwnVenues();
    return venues[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchPartnershipRequests(direction: PartnershipRequestDirection): Promise<VenuePartnershipRequest[]> {
  const orgId = getActiveOrgId();
  if (!orgId) return [];

  if (!partnershipRequestsCache) {
    const [{ items: partnershipItems }, { items: connectionItems }] = await Promise.all([
      partnershipApi.list(orgId),
      promoterConnectionApi.list(orgId),
    ]);
    // Pending rows only are requests; active rows live in the Connected tab.
    // Resolved rows (rejected/blocked/ended/revoked) must not linger here.
    const partnershipRequests = partnershipItems
      .filter((p) => p.status === 'pending')
      .map(mapPartnershipToRequest);
    const connectionRequests = connectionItems
      .filter((c) => c.status === 'pending')
      .map(mapPromoterConnectionToRequest);
    partnershipRequestsCache = [...partnershipRequests, ...connectionRequests];
  }
  return partnershipRequestsCache.filter((request) => request.direction === direction);
}

export function clearCache() {
  hostPartnersCache = null;
  promoterPartnersCache = null;
  discoverableHostsCache = null;
  discoverablePromotersCache = null;
  partnershipRequestsCache = null;
}

export function getVenuePartners(kind: VenuePartnerKind): readonly VenuePartner[] {
  if (kind === 'host') {
    return hostPartnersCache ?? [];
  } else {
    return promoterPartnersCache ?? [];
  }
}

export function getDiscoverablePartners(kind: VenuePartnerKind): readonly DiscoverablePartner[] {
  if (kind === 'host') {
    return discoverableHostsCache ?? [];
  } else {
    return discoverablePromotersCache ?? [];
  }
}

export function getPartnershipRequests(direction: PartnershipRequestDirection): readonly VenuePartnershipRequest[] {
  return (partnershipRequestsCache ?? []).filter((request) => request.direction === direction);
}