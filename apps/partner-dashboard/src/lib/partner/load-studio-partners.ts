import 'server-only';

import { cookies } from 'next/headers';

import { ApiClientError } from '@c1rcle/api-client';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';
import {
  getDiscoverablePartners,
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
  const organizationId =
    options.organizationId !== undefined
      ? options.organizationId
      : getActiveOrgIdFromCookieHeader(cookieHeader);

  if (!organizationId) {
    throw new StudioPartnersLoadError(
      'no-organization',
      'No active organization selected — the partners tab has no tenant to read.',
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
  const organizationId =
    options.organizationId !== undefined
      ? options.organizationId
      : getActiveOrgIdFromCookieHeader(cookieHeader);

  if (!organizationId) {
    throw new StudioPartnersLoadError(
      'no-organization',
      'No active organization selected — the partners tab has no tenant to read.',
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
  const organizationId =
    options.organizationId !== undefined
      ? options.organizationId
      : getActiveOrgIdFromCookieHeader(cookieHeader);

  if (!organizationId) {
    throw new StudioPartnersLoadError(
      'no-organization',
      'No active organization selected — the partners tab has no tenant to read.',
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
