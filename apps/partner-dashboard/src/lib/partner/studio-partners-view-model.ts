import type {
  HostPartnersData,
  PartnerCardTone,
  PartnerKind,
  PartnerRelationship,
  PartnerRelationshipSet,
  PartnerRequest,
  PromoterPartnerRecord,
  PromoterPartnersData,
  VenuePartnersData,
} from '@/data/partner-data-source';
import type { DiscoverPartnerDto, PartnershipDto, PromoterConnectionDto } from '@c1rcle/contracts';

/**
 * ─── Studio partners view model (pure) ─────────────────────────────────────
 *
 * Maps gateway DTOs onto the `partner-v3` screen shapes. Everything the API
 * does not return is rendered as absent — empty arrays, `'—'` locations, no
 * verified badge — never invented. That is why genre/performance facets and
 * staff rows are empty here: the backend has no such fields, and a convincing
 * placeholder would be dummy data by another name.
 */

const CARD_TONES: readonly PartnerCardTone[] = [
  'orange',
  'violet',
  'teal',
  'pink',
  'gold',
  'indigo',
  'slate',
];

export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function toneOf(id: string): PartnerCardTone {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CARD_TONES[hash % CARD_TONES.length] ?? 'slate';
}

function shortId(id: string): string {
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`;
}

const ROLE_LABEL: Readonly<Record<PartnerKind, string>> = {
  host: 'Host',
  venue: 'Venue',
  promoter: 'Promoter',
};

function relationshipBase(
  id: string,
  kind: PartnerKind,
  name: string,
  location: string | null | undefined,
  verified: boolean,
): Omit<PartnerRelationship, 'status'> {
  return {
    id,
    name,
    initials: initialsOf(name),
    kind,
    role: ROLE_LABEL[kind],
    location: location ?? '—',
    genres: [],
    stats: [],
    upcomingEvents: [],
    verified,
    cardTone: toneOf(id),
  };
}

export type LiveRequestTarget =
  | { readonly graph: 'partnership'; readonly id: string }
  | { readonly graph: 'promoter-connection'; readonly id: string };

function partnershipRequestRow(
  item: PartnershipDto,
  viewer: 'venue' | 'host',
  kind: 'host' | 'venue',
  name: string,
): { readonly request: PartnerRequest; readonly createdAt: string; readonly pending: boolean } {
  const outgoing = item.initiatedBy === viewer;
  return {
    createdAt: item.createdAt,
    pending: item.status === 'pending',
    request: {
      id: item.id,
      name,
      initials: initialsOf(name),
      kind,
      direction: outgoing ? 'outgoing' : 'incoming',
      note: item.message ?? '',
      target: { graph: 'partnership', id: item.id },
    },
  };
}

function promoterRequestRow(
  item: PromoterConnectionDto,
  viewer: 'promoter' | 'target',
  kind: PartnerKind,
  name: string,
): { readonly request: PartnerRequest; readonly createdAt: string; readonly pending: boolean } {
  const outgoing =
    (viewer === 'promoter' && item.initiatedBy === 'promoter') ||
    (viewer === 'target' && item.initiatedBy === 'target');
  return {
    createdAt: item.createdAt,
    pending: item.status === 'pending',
    request: {
      id: item.id,
      name,
      initials: initialsOf(name),
      kind,
      direction: outgoing ? 'outgoing' : 'incoming',
      note: item.message ?? '',
      target: { graph: 'promoter-connection', id: item.id },
    },
  };
}

const byNewest = <T extends { readonly createdAt: string }>(a: T, b: T): number =>
  a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;

interface SplitRequests {
  readonly incoming: readonly PartnerRequest[];
  readonly outgoing: readonly PartnerRequest[];
}

function splitPending(
  rows: readonly {
    readonly request: PartnerRequest;
    readonly createdAt: string;
    readonly pending: boolean;
  }[],
): SplitRequests {
  const pending = rows.filter((row) => row.pending).sort(byNewest);
  return {
    incoming: pending
      .filter(({ request }) => request.direction === 'incoming')
      .map(({ request }) => request),
    outgoing: pending
      .filter(({ request }) => request.direction === 'outgoing')
      .map(({ request }) => request),
  };
}

/** Venue studio: hosts from partnerships, promoters from promoter-connections. */
export function toVenuePartnersData(input: {
  readonly partnerships: readonly PartnershipDto[];
  readonly promoterConnections: readonly PromoterConnectionDto[];
  readonly discoveredHosts: readonly DiscoverPartnerDto[];
  readonly discoveredPromoters: readonly DiscoverPartnerDto[];
}): VenuePartnersData {
  const { partnerships, promoterConnections } = input;

  const hosts: PartnerRelationshipSet = {
    connected: partnerships
      .filter((item) => item.status === 'active')
      .map((item): PartnerRelationship => {
        const name = item.hostName ?? shortId(item.hostOrganizationId);
        return {
          ...relationshipBase(item.id, 'host', name, null, false),
          status: 'Partnered',
        };
      }),
    discover: input.discoveredHosts.map((item): PartnerRelationship => ({
      ...relationshipBase(item.id, 'host', item.name, item.city, item.verified),
    })),
    requests: splitPending(
      partnerships.map((item) =>
        partnershipRequestRow(
          item,
          'venue',
          'host',
          item.hostName ?? shortId(item.hostOrganizationId),
        ),
      ),
    ),
  };

  const venueConnections = promoterConnections.filter(
    (item) => item.status === 'active' || item.status === 'pending',
  );
  const promoters: PartnerRelationshipSet = {
    connected: venueConnections
      .filter((item) => item.status === 'active')
      .map((item): PartnerRelationship => {
        const name = item.promoterName ?? shortId(item.promoterId);
        return {
          ...relationshipBase(item.id, 'promoter', name, item.targetCity, false),
          status: 'Partnered',
        };
      }),
    discover: input.discoveredPromoters.map((item): PartnerRelationship => ({
      ...relationshipBase(item.id, 'promoter', item.name, item.city, item.verified),
    })),
    requests: splitPending(
      promoterConnections.map((item) =>
        promoterRequestRow(
          item,
          'target',
          'promoter',
          item.promoterName ?? shortId(item.promoterId),
        ),
      ),
    ),
  };

  return { dataStatus: 'api', hosts, promoters, staff: [] };
}

/** Host studio: venues from partnerships, promoters from promoter-connections. */
export function toHostPartnersData(input: {
  readonly partnerships: readonly PartnershipDto[];
  readonly promoterConnections: readonly PromoterConnectionDto[];
  readonly discoveredVenues: readonly DiscoverPartnerDto[];
  readonly discoveredPromoters: readonly DiscoverPartnerDto[];
}): HostPartnersData {
  const { partnerships, promoterConnections } = input;

  const venues: PartnerRelationshipSet = {
    connected: partnerships
      .filter((item) => item.status === 'active')
      .map((item): PartnerRelationship => {
        const name = item.venueName ?? shortId(item.venueOrganizationId);
        return {
          ...relationshipBase(item.id, 'venue', name, null, false),
          status: 'Partnered',
        };
      }),
    discover: input.discoveredVenues.map((item): PartnerRelationship => ({
      ...relationshipBase(item.id, 'venue', item.name, item.city, item.verified),
    })),
    requests: splitPending(
      partnerships.map((item) =>
        partnershipRequestRow(
          item,
          'host',
          'venue',
          item.venueName ?? shortId(item.venueOrganizationId),
        ),
      ),
    ),
  };

  const promoters: PartnerRelationshipSet = {
    connected: promoterConnections
      .filter((item) => item.status === 'active')
      .map((item): PartnerRelationship => {
        const name = item.promoterName ?? shortId(item.promoterId);
        return {
          ...relationshipBase(item.id, 'promoter', name, item.targetCity, false),
          status: 'Partnered',
        };
      }),
    discover: input.discoveredPromoters.map((item): PartnerRelationship => ({
      ...relationshipBase(item.id, 'promoter', item.name, item.city, item.verified),
    })),
    requests: splitPending(
      promoterConnections.map((item) =>
        promoterRequestRow(
          item,
          'target',
          'promoter',
          item.promoterName ?? shortId(item.promoterId),
        ),
      ),
    ),
  };

  return { dataStatus: 'api', venues, promoters, staff: [] };
}

/** Promoter studio: everything hangs off the promoter's own connections. */
export function toPromoterPartnersData(input: {
  readonly organizationId: string;
  readonly promoterConnections: readonly PromoterConnectionDto[];
  readonly discovered: readonly DiscoverPartnerDto[];
}): PromoterPartnersData {
  const { promoterConnections, discovered } = input;
  const mine = promoterConnections.filter((item) => item.promoterId === input.organizationId);

  const recordFor = (
    item: PromoterConnectionDto,
    state: PromoterPartnerRecord['state'],
  ): PromoterPartnerRecord => {
    const kind = item.targetType;
    const name = item.targetName ?? shortId(item.targetId);
    return {
      id: item.id,
      name,
      initials: initialsOf(name),
      kind,
      role: ROLE_LABEL[kind],
      location: item.targetCity ?? '—',
      genres: [],
      stats: [],
      upcomingEvents: [],
      verified: false,
      cardTone: toneOf(item.id),
      state,
      actionLabel: state === 'active' ? 'Connected' : 'Send Request',
    };
  };

  const active = mine
    .filter((item) => item.status === 'active')
    .map((item) => recordFor(item, 'active'));
  const discover = discovered.map((item): PromoterPartnerRecord => ({
    id: item.id,
    name: item.name,
    initials: initialsOf(item.name),
    kind: item.kind === 'host' ? 'host' : 'venue',
    role: ROLE_LABEL[item.kind === 'host' ? 'host' : 'venue'],
    location: item.city ?? '—',
    genres: [],
    stats: [],
    upcomingEvents: [],
    verified: item.verified,
    cardTone: toneOf(item.id),
    state: 'discover',
    actionLabel: 'Send Request',
  }));
  const incoming = mine
    .filter((item) => item.status === 'pending' && item.initiatedBy === 'target')
    .sort(byNewest)
    .map(
      (item) =>
        promoterRequestRow(
          item,
          'promoter',
          item.targetType,
          item.targetName ?? shortId(item.targetId),
        ).request,
    );
  const pending = mine
    .filter((item) => item.status === 'pending' && item.initiatedBy === 'promoter')
    .sort(byNewest)
    .map(
      (item) =>
        promoterRequestRow(
          item,
          'promoter',
          item.targetType,
          item.targetName ?? shortId(item.targetId),
        ).request,
    );
  const declined = mine
    .filter((item) => item.status === 'rejected')
    .sort(byNewest)
    .map(
      (item) =>
        promoterRequestRow(
          item,
          'promoter',
          item.targetType,
          item.targetName ?? shortId(item.targetId),
        ).request,
    );

  return {
    dataStatus: 'api',
    activePartnersCount: active.length,
    pendingPartnersCount: pending.length,
    venuesCount: [...active, ...discover].filter((item) => item.kind === 'venue').length,
    hostsCount: [...active, ...discover].filter((item) => item.kind === 'host').length,
    active,
    discover,
    incoming,
    pending,
    declined,
  };
}
