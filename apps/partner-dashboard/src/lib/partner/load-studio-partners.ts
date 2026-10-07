import 'server-only';

import { cookies } from 'next/headers';

import { ApiClientError } from '@c1rcle/api-client';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';
import {
  getDiscoverablePartners,
  getMyOrganizations,
  getOrganizationAccess,
  getPartnerships,
  getPromoterConnections,
} from '@/lib/partner/partner-graph-repository';
import {
  toHostPartnersData,
  toPromoterPartnersData,
  toVenuePartnersData,
} from '@/lib/partner/studio-partners-view-model';

import type {
  HostPartnersData,
  PromoterPartnersData,
  VenuePartnersData,
} from '@/data/partner-data-source';
import type { ServerApiClient } from '@/lib/api/server-client';

/**
 * ─── Server loader for the studio partners route ───────────────────────────
 *
 * The one place real `VenuePartnersData` / `HostPartnersData` /
 * `PromoterPartnersData` come from. Same contract as the overview loader: if
 * the API cannot answer, this throws and the route says so — it never degrades
 * to fixture rows.
 */

export type StudioPartnersLoadFailure = 'signed-out' | 'no-organization' | 'forbidden' | 'api';

export class StudioPartnersLoadError extends Error {
  constructor(
    readonly reason: StudioPartnersLoadFailure,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'StudioPartnersLoadError';
  }
}

export function classifyStudioPartnersFailure(cause: unknown): StudioPartnersLoadFailure {
  if (cause instanceof ApiClientError) {
    if (cause.isAuthFailure) return 'signed-out';
    if (cause.status === 403) return 'forbidden';
  }
  return 'api';
}

export interface StudioPartnersLoaderOptions {
  /** Injected in tests; defaults to a client built from this request's cookies. */
  readonly client?: ServerApiClient;
  readonly organizationId?: string | null;
}

/**
 * Which organization the studio tab reads as. The cookie wins when present
 * (explicit user choice); otherwise the org is derived from the session —
 * login is venue/host/promoter directly, there is no selection step, so the
 * first org whose server-computed partner type matches the studio is used.
 * Throws `no-organization` when the account has no orgs at all and
 * `forbidden` when none of them grants this studio's type.
 *
 * Exported so the route can resolve once up front and hand the id to both
 * the data load (via options) and the client action islands as a prop —
 * browser cookie reads are only a fallback there, never the source of truth.
 */
export async function resolveStudioOrganizationId(
  client: ServerApiClient,
  studio: 'venue' | 'host' | 'promoter',
  options: StudioPartnersLoaderOptions,
  cookieHeader: string,
): Promise<string> {
  const direct =
    options.organizationId !== undefined
      ? options.organizationId
      : getActiveOrgIdFromCookieHeader(cookieHeader);
  if (direct) return direct;

  const orgs = await getMyOrganizations(client);
  if (orgs.length === 0) {
    throw new StudioPartnersLoadError(
      'no-organization',
      'This account has no organization yet — the partners tab has no tenant to read.',
    );
  }
  const matches: string[] = [];
  await Promise.all(
    orgs.map(async (org) => {
      try {
        const access = await getOrganizationAccess(client, org.id);
        if (access.partnerType === studio) matches.push(org.id);
      } catch {
        // An org the caller cannot reach (403, suspended) is dropped rather
        // than surfaced — same rule as the login-time workspace picker.
      }
    }),
  );
  const pick = [...matches].sort()[0];
  if (pick) return pick;
  throw new StudioPartnersLoadError(
    'forbidden',
    `This account has no ${studio} access — none of its organizations grant it.`,
  );
}

async function readGraph(client: ServerApiClient, organizationId: string) {
  const [partnerships, promoterConnections] = await Promise.all([
    getPartnerships(client, organizationId),
    getPromoterConnections(client, organizationId),
  ]);
  return { partnerships, promoterConnections };
}

export async function loadVenuePartnersData(
  options: StudioPartnersLoaderOptions = {},
): Promise<VenuePartnersData> {
  const cookieHeader = (await cookies()).toString();
  const client = options.client ?? createServerApiClient(cookieHeader);
  let organizationId: string;
  try {
    organizationId = await resolveStudioOrganizationId(client, 'venue', options, cookieHeader);
  } catch (cause) {
    if (cause instanceof StudioPartnersLoadError) throw cause;
    throw new StudioPartnersLoadError(
      classifyStudioPartnersFailure(cause),
      'Could not determine the venue organization for this session.',
      { cause },
    );
  }

  try {
    const [{ partnerships, promoterConnections }, discoveredHosts, discoveredPromoters] =
      await Promise.all([
        readGraph(client, organizationId),
        getDiscoverablePartners(client, organizationId, { type: 'host' }),
        getDiscoverablePartners(client, organizationId, { type: 'promoter' }),
      ]);
    return toVenuePartnersData({
      partnerships,
      promoterConnections,
      discoveredHosts,
      discoveredPromoters,
    });
  } catch (cause) {
    throw new StudioPartnersLoadError(
      classifyStudioPartnersFailure(cause),
      `Could not load partners data for organization ${organizationId}`,
      { cause },
    );
  }
}

export async function loadHostPartnersData(
  options: StudioPartnersLoaderOptions = {},
): Promise<HostPartnersData> {
  const cookieHeader = (await cookies()).toString();
  const client = options.client ?? createServerApiClient(cookieHeader);
  let organizationId: string;
  try {
    organizationId = await resolveStudioOrganizationId(client, 'host', options, cookieHeader);
  } catch (cause) {
    if (cause instanceof StudioPartnersLoadError) throw cause;
    throw new StudioPartnersLoadError(
      classifyStudioPartnersFailure(cause),
      'Could not determine the host organization for this session.',
      { cause },
    );
  }

  try {
    const [{ partnerships, promoterConnections }, discoveredVenues, discoveredPromoters] =
      await Promise.all([
        readGraph(client, organizationId),
        getDiscoverablePartners(client, organizationId, { type: 'venue' }),
        getDiscoverablePartners(client, organizationId, { type: 'promoter' }),
      ]);
    return toHostPartnersData({
      partnerships,
      promoterConnections,
      discoveredVenues,
      discoveredPromoters,
    });
  } catch (cause) {
    throw new StudioPartnersLoadError(
      classifyStudioPartnersFailure(cause),
      `Could not load partners data for organization ${organizationId}`,
      { cause },
    );
  }
}

export async function loadPromoterPartnersData(
  options: StudioPartnersLoaderOptions = {},
): Promise<PromoterPartnersData> {
  const cookieHeader = (await cookies()).toString();
  const client = options.client ?? createServerApiClient(cookieHeader);
  let organizationId: string;
  try {
    organizationId = await resolveStudioOrganizationId(client, 'promoter', options, cookieHeader);
  } catch (cause) {
    if (cause instanceof StudioPartnersLoadError) throw cause;
    throw new StudioPartnersLoadError(
      classifyStudioPartnersFailure(cause),
      'Could not determine the promoter organization for this session.',
      { cause },
    );
  }

  try {
    const [promoterConnections, discovered] = await Promise.all([
      getPromoterConnections(client, organizationId),
      getDiscoverablePartners(client, organizationId),
    ]);
    return toPromoterPartnersData({ organizationId, promoterConnections, discovered });
  } catch (cause) {
    throw new StudioPartnersLoadError(
      classifyStudioPartnersFailure(cause),
      `Could not load partners data for organization ${organizationId}`,
      { cause },
    );
  }
}
