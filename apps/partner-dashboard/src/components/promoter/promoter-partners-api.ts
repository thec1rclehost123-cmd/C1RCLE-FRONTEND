import { promoterConnectionApi } from '@/lib/api/partner-connections';
import { getActiveOrgId } from '@/lib/org/active-org';

import type { PromoterConnectionDto } from '@/lib/api/partner-connections';

export type PromoterPartnerKind = 'venue' | 'host';

export interface PromoterPartner {
  readonly id: string;
  readonly kind: PromoterPartnerKind;
  readonly name: string;
  readonly city: string;
  readonly category: string;
  readonly verified: boolean;
  readonly status: 'partnered' | 'pending' | 'discover';
  readonly eventsTogether: number;
  readonly responseTime: string;
  readonly accent: string;
}

export interface PromoterRequest {
  readonly id: string;
  readonly kind: PromoterPartnerKind;
  readonly partnerName: string;
  readonly partnerCity: string;
  readonly eventName: string;
  readonly eventDate: string;
  readonly commission: string;
  readonly status: 'pending' | 'accepted' | 'rejected' | 'under review';
  readonly direction: 'incoming' | 'sent';
}

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

function mapConnectionToPartner(c: PromoterConnectionDto): PromoterPartner {
  const isVenue = c.targetType === 'venue';
  const label =
    c.targetName ??
    (isVenue
      ? `Venue ${c.targetId.slice(-6).toUpperCase()}`
      : `Host ${c.targetId.slice(-6).toUpperCase()}`);
  return {
    id: c.id,
    kind: c.targetType,
    name: label,
    city: '—',
    category: isVenue ? 'Venue' : 'Host Organisation',
    verified: false,
    status: c.status === 'active' ? 'partnered' : c.status === 'pending' ? 'pending' : 'discover',
    eventsTogether: 0,
    responseTime: '—',
    accent: isVenue ? 'amber' : 'violet',
  };
}

function mapConnectionToRequest(c: PromoterConnectionDto, direction: 'incoming' | 'sent'): PromoterRequest {
  const isVenue = c.targetType === 'venue';
  const label =
    c.targetName ??
    (isVenue
      ? `Venue ${c.targetId.slice(-6).toUpperCase()}`
      : `Host ${c.targetId.slice(-6).toUpperCase()}`);
  const statusMap: Record<string, PromoterRequest['status']> = {
    pending: 'pending',
    active: 'accepted',
    rejected: 'rejected',
    blocked: 'rejected',
    revoked: 'under review',
  };
  return {
    id: c.id,
    kind: c.targetType,
    partnerName: label,
    partnerCity: '—',
    eventName: '—',
    eventDate: formatDate(c.createdAt),
    commission: '—',
    status: statusMap[c.status] ?? 'pending',
    direction,
  };
}


let venuePartnersCache: PromoterPartner[] | null = null;
let hostPartnersCache: PromoterPartner[] | null = null;
let venueRequestsCache: PromoterRequest[] | null = null;
let hostRequestsCache: PromoterRequest[] | null = null;

export async function fetchPromoterVenuePartners(): Promise<PromoterPartner[]> {
  if (venuePartnersCache) return venuePartnersCache;
  const orgId = getActiveOrgId();
  if (!orgId) return [];
  const { items } = await promoterConnectionApi.list(orgId);
  venuePartnersCache = items
    .filter((c) => c.targetType === 'venue' && c.status === 'active')
    .map(mapConnectionToPartner);
  return venuePartnersCache;
}

export async function fetchPromoterHostPartners(): Promise<PromoterPartner[]> {
  if (hostPartnersCache) return hostPartnersCache;
  const orgId = getActiveOrgId();
  if (!orgId) return [];
  const { items } = await promoterConnectionApi.list(orgId);
  hostPartnersCache = items
    .filter((c) => c.targetType === 'host' && c.status === 'active')
    .map(mapConnectionToPartner);
  return hostPartnersCache;
}

export async function fetchPromoterVenueRequests(): Promise<PromoterRequest[]> {
  if (venueRequestsCache) return venueRequestsCache;
  const orgId = getActiveOrgId();
  if (!orgId) return [];
  const { items } = await promoterConnectionApi.list(orgId);
  // Requests tabs show pending rows only: active → Active tab,
  // rejected/blocked/revoked → Declined. Direction splits the same pending
  // set so the sender sees `sent` and the receiver sees `incoming`.
  venueRequestsCache = items
    .filter((c) => c.targetType === 'venue' && c.status === 'pending')
    .map((c) => mapConnectionToRequest(c, c.initiatedBy === 'promoter' ? 'sent' : 'incoming'));
  return venueRequestsCache;
}

export async function fetchPromoterHostRequests(): Promise<PromoterRequest[]> {
  if (hostRequestsCache) return hostRequestsCache;
  const orgId = getActiveOrgId();
  if (!orgId) return [];
  const { items } = await promoterConnectionApi.list(orgId);
  hostRequestsCache = items
    .filter((c) => c.targetType === 'host' && c.status === 'pending')
    .map((c) => mapConnectionToRequest(c, c.initiatedBy === 'promoter' ? 'sent' : 'incoming'));
  return hostRequestsCache;
}

export function clearCache() {
  venuePartnersCache = null;
  hostPartnersCache = null;
  venueRequestsCache = null;
  hostRequestsCache = null;
}

export function getPromoterVenuePartners(): PromoterPartner[] {
  return venuePartnersCache ?? [];
}

export function getPromoterHostPartners(): PromoterPartner[] {
  return hostPartnersCache ?? [];
}

export function getPromoterVenueRequests(): PromoterRequest[] {
  return venueRequestsCache ?? [];
}

export function getPromoterHostRequests(): PromoterRequest[] {
  return hostRequestsCache ?? [];
}