import { partnershipApi, promoterConnectionApi } from '@/lib/api/partner-connections';
import { getActiveOrgId } from '@/lib/org/active-org';

import type { PartnershipDto, PromoterConnectionDto } from '@/lib/api/partner-connections';

export type HostPartnerKind = 'venue' | 'promoter';

export interface HostPartner {
  readonly id: string;
  readonly kind: HostPartnerKind;
  readonly name: string;
  readonly city: string;
  readonly status: 'Active' | 'Pending' | 'Discover';
  readonly verified: boolean;
  readonly eventsTogether: number;
  readonly detail: string;
}

export interface HostPartnerRequest {
  readonly id: string;
  readonly kind: HostPartnerKind;
  readonly partnerName: string;
  readonly partnerCity: string;
  readonly eventName: string;
  readonly eventDate: string;
  readonly status: 'Pending' | 'Accepted' | 'Declined' | 'Needs changes';
  readonly updatedAt: string;
  readonly direction: 'incoming' | 'sent';
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
 * Maps a PartnershipDto to a HostPartner.
 * The venue is always the counterparty from the host dashboard's perspective.
 * Fields not yet returned by the backend are shown as "—" rather than dummy data.
 */
function mapPartnershipToPartner(p: PartnershipDto): HostPartner {
  const venueLabel = p.venueName ?? `Venue ${p.venueId.slice(-6).toUpperCase()}`;
  return {
    id: p.id,
    kind: 'venue',
    name: venueLabel,
    city: '—',
    status: p.status === 'active' ? 'Active' : 'Pending',
    verified: false,
    eventsTogether: 0,
    detail: `Connected ${formatDate(p.updatedAt)}`,
  };
}

/**
 * Maps a PromoterConnectionDto to a HostPartner.
 * Fields not yet returned by the backend are shown as "—".
 */
function mapPromoterConnectionToPartner(c: PromoterConnectionDto): HostPartner {
  const promoterLabel = c.promoterName ?? `Promoter ${c.promoterId.slice(-6).toUpperCase()}`;
  return {
    id: c.id,
    kind: 'promoter',
    name: promoterLabel,
    city: '—',
    status: c.status === 'active' ? 'Active' : 'Pending',
    verified: false,
    eventsTogether: 0,
    detail: `Connected ${formatDate(c.updatedAt)}`,
  };
}

/**
 * Maps a PartnershipDto to a HostPartnerRequest.
 * Direction:
 *   - 'host'  initiated → 'sent' (host sent the request)
 *   - 'venue' initiated → 'incoming' (venue sent, host received)
 */
function mapPartnershipToRequest(p: PartnershipDto, direction: 'incoming' | 'sent'): HostPartnerRequest {
  const venueLabel = p.venueName ?? `Venue ${p.venueId.slice(-6).toUpperCase()}`;
  const statusMap: Record<string, HostPartnerRequest['status']> = {
    pending: 'Pending',
    active: 'Accepted',
    rejected: 'Declined',
    blocked: 'Declined',
    ended: 'Needs changes',
  };
  return {
    id: p.id,
    kind: 'venue',
    partnerName: venueLabel,
    partnerCity: '—',
    eventName: '—',
    eventDate: formatDate(p.createdAt),
    status: statusMap[p.status] ?? 'Pending',
    updatedAt: formatDate(p.updatedAt),
    direction,
  };
}

/**
 * Maps a PromoterConnectionDto to a HostPartnerRequest.
 * Direction:
 *   - 'target'   initiated → 'sent' (host/target sent the request)
 *   - 'promoter' initiated → 'incoming' (promoter sent, host received)
 */
function mapPromoterConnectionToRequest(
  c: PromoterConnectionDto,
  direction: 'incoming' | 'sent',
): HostPartnerRequest {
  const promoterLabel = c.promoterName ?? `Promoter ${c.promoterId.slice(-6).toUpperCase()}`;
  const statusMap: Record<string, HostPartnerRequest['status']> = {
    pending: 'Pending',
    active: 'Accepted',
    rejected: 'Declined',
    blocked: 'Declined',
    revoked: 'Needs changes',
  };
  return {
    id: c.id,
    kind: 'promoter',
    partnerName: promoterLabel,
    partnerCity: '—',
    eventName: '—',
    eventDate: formatDate(c.createdAt),
    status: statusMap[c.status] ?? 'Pending',
    updatedAt: formatDate(c.updatedAt),
    direction,
  };
}

// ── In-memory cache ──────────────────────────────────────────────────────────

let venuePartnersCache: HostPartner[] | null = null;
let promoterPartnersCache: HostPartner[] | null = null;
let venueRequestsCache: HostPartnerRequest[] | null = null;
let promoterRequestsCache: HostPartnerRequest[] | null = null;

/**
 * Fetches active venue partnerships for the host's "My Partners – Venues" view.
 */
export async function fetchHostVenuePartners(): Promise<HostPartner[]> {
  if (venuePartnersCache) return venuePartnersCache;
  const orgId = getActiveOrgId();
  if (!orgId) return [];
  const { items } = await partnershipApi.list(orgId);
  venuePartnersCache = items
    .filter((p) => p.status === 'active')
    .map(mapPartnershipToPartner);
  return venuePartnersCache;
}

/**
 * Fetches active promoter connections for the host's "My Partners – Promoters" view.
 */
export async function fetchHostPromoterPartners(): Promise<HostPartner[]> {
  if (promoterPartnersCache) return promoterPartnersCache;
  const orgId = getActiveOrgId();
  if (!orgId) return [];
  const { items } = await promoterConnectionApi.list(orgId);
  promoterPartnersCache = items
    .filter((c) => c.status === 'active')
    .map(mapPromoterConnectionToPartner);
  return promoterPartnersCache;
}

/**
 * Fetches venue partnership requests for the host's Requests tab.
 * Only pending rows are requests (active → Connected; rejected/blocked/ended
 * are resolved and must not linger as answerable rows); direction is derived
 * from the `initiatedBy` field so the sent request is visible to the sender
 * as `sent` and to the receiver as `incoming`.
 */
export async function fetchHostVenueRequests(): Promise<HostPartnerRequest[]> {
  if (venueRequestsCache) return venueRequestsCache;
  const orgId = getActiveOrgId();
  if (!orgId) return [];
  const { items } = await partnershipApi.list(orgId);
  venueRequestsCache = items
    .filter((p) => p.status === 'pending')
    .map((p) => mapPartnershipToRequest(p, p.initiatedBy === 'host' ? 'sent' : 'incoming'));
  return venueRequestsCache;
}

/**
 * Fetches promoter connection requests for the host's Requests tab.
 * Only pending rows are requests; direction is derived
 * from the `initiatedBy` field.
 */
export async function fetchHostPromoterRequests(): Promise<HostPartnerRequest[]> {
  if (promoterRequestsCache) return promoterRequestsCache;
  const orgId = getActiveOrgId();
  if (!orgId) return [];
  const { items } = await promoterConnectionApi.list(orgId);
  promoterRequestsCache = items
    .filter((c) => c.status === 'pending')
    .map((c) => mapPromoterConnectionToRequest(c, c.initiatedBy === 'target' ? 'sent' : 'incoming'));
  return promoterRequestsCache;
}

export function clearCache(): void {
  venuePartnersCache = null;
  promoterPartnersCache = null;
  venueRequestsCache = null;
  promoterRequestsCache = null;
}

export function getHostVenuePartners(): HostPartner[] {
  return venuePartnersCache ?? [];
}

export function getHostPromoterPartners(): HostPartner[] {
  return promoterPartnersCache ?? [];
}

export function getHostVenueRequests(): HostPartnerRequest[] {
  return venueRequestsCache ?? [];
}

export function getHostPromoterRequests(): HostPartnerRequest[] {
  return promoterRequestsCache ?? [];
}