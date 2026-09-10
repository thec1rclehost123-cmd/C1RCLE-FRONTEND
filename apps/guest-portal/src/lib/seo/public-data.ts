import 'server-only';

import { createApiClient } from '@c1rcle/api-client';
import {
  discoveryFeedDtoSchema,
  eventPublicDetailDtoSchema,
  hostPublicDtoSchema,
  venuePublicDetailDtoSchema,
} from '@c1rcle/contracts';

import { isProductionSeo } from './site';

import type {
  DiscoveryFeedDto,
  EventDto,
  EventPublicDetailDto,
  HostPublicDto,
  VenuePublicDetailDto,
} from '@c1rcle/contracts';
import type { z } from 'zod';

const EXPIRED_EVENT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

async function readPublic<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
  try {
    return await createApiClient({ maxRetries: 0, timeoutMs: 3_000 }).get({ path, schema });
  } catch {
    return null;
  }
}

export function isEligiblePublicEvent(event: EventDto, now = new Date()): boolean {
  const startAt = Date.parse(event.startAt);
  return (
    event.status === 'published' &&
    event.isPublic &&
    event.slug.length > 0 &&
    event.title.trim().length > 0 &&
    event.summary.trim().length > 0 &&
    event.imageUrl !== null &&
    event.venueId !== null &&
    Number.isFinite(startAt) &&
    startAt >= now.getTime() - EXPIRED_EVENT_RETENTION_MS
  );
}

/**
 * A venue returned by the public endpoint is public-safe, but the current DTO
 * has no verified/publication flag. Keep it out of search until that contract
 * exists rather than inferring verification from an active status.
 */
export function isEligiblePublicVenue(_venue: VenuePublicDetailDto): boolean {
  return false;
}

/** The public host DTO lacks classification, verification and description. */
export function isEligiblePublicHost(_host: HostPublicDto): boolean {
  return false;
}

export async function getPublicEventForSeo(slug: string): Promise<EventPublicDetailDto | null> {
  if (!isProductionSeo()) return null;
  const detail = await readPublic<EventPublicDetailDto>(
    `/api/v2/public/events/${encodeURIComponent(slug)}`,
    eventPublicDetailDtoSchema,
  );
  return detail !== null && isEligiblePublicEvent(detail) ? detail : null;
}

export async function getPublicVenueForSeo(slug: string): Promise<VenuePublicDetailDto | null> {
  if (!isProductionSeo()) return null;
  return readPublic<VenuePublicDetailDto>(
    `/api/v2/public/venues/${encodeURIComponent(slug)}`,
    venuePublicDetailDtoSchema,
  );
}

export async function getPublicHostForSeo(slug: string): Promise<HostPublicDto | null> {
  if (!isProductionSeo()) return null;
  return readPublic<HostPublicDto>(
    `/api/v2/public/hosts/${encodeURIComponent(slug)}`,
    hostPublicDtoSchema,
  );
}

export async function getPublicEventsForSitemap(): Promise<readonly EventDto[]> {
  if (!isProductionSeo()) return [];
  const feed = await readPublic<DiscoveryFeedDto>(
    '/api/v2/public/discovery',
    discoveryFeedDtoSchema,
  );
  return feed?.items.filter((event) => isEligiblePublicEvent(event)) ?? [];
}

// No authoritative public venue/host list contracts exist in this checkout.
export function getPublicVenuesForSitemap(): Promise<readonly VenuePublicDetailDto[]> {
  return Promise.resolve([]);
}

export function getPublicHostsForSitemap(): Promise<readonly HostPublicDto[]> {
  return Promise.resolve([]);
}
