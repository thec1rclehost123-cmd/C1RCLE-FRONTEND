import 'server-only';

import { cookies } from 'next/headers';

import { createApiClient, isApiClientError } from '@c1rcle/api-client';
import {
  followDtoSchema,
  followListResponseSchema,
  followStatusDtoSchema,
  hostPublicDtoSchema,
  markReadResultDtoSchema,
  noContentSchema,
  notificationListResponseSchema,
  unreadCountDtoSchema,
  venueDtoSchema,
} from '@c1rcle/contracts';

import type {
  FollowListResponse,
  FollowStatusDto,
  FollowTargetTypeDto,
  NotificationListResponse,
} from '@c1rcle/contracts';
import type { z } from 'zod';

/**
 * Session-scoped reads and commands for the Phase 8 follow graph and guest
 * notification inbox (`/api/v2/follows*`, `/api/v2/notifications/me*`).
 *
 * The guest portal has no browser-side bearer token, so every call is made
 * server-to-server with the incoming request's cookie forwarded — the same
 * trust path `getServerSession` uses. The gateway owns authorization; a 401
 * here only decides which UI state to render.
 */

export type SessionResult<T> =
  | { readonly status: 'ok'; readonly data: T }
  | { readonly status: 'unauthenticated' }
  | { readonly status: 'unavailable' };

const UNAUTHENTICATED = { status: 'unauthenticated' } as const;
const UNAVAILABLE = { status: 'unavailable' } as const;

async function withSession<T>(
  call: (client: ReturnType<typeof createApiClient>, cookie: string) => Promise<T>,
): Promise<SessionResult<T>> {
  const cookie = (await cookies()).toString();
  if (cookie.length === 0) return UNAUTHENTICATED;

  try {
    const data = await call(createApiClient({ maxRetries: 1, timeoutMs: 5_000 }), cookie);
    return { status: 'ok', data };
  } catch (error) {
    if (isApiClientError(error) && error.status === 401) return UNAUTHENTICATED;
    return UNAVAILABLE;
  }
}

function targetPath(targetType: FollowTargetTypeDto, targetId: string) {
  return `/api/v2/follows/${targetType}/${encodeURIComponent(targetId)}`;
}

export function getFollowStatus(
  targetType: FollowTargetTypeDto,
  targetId: string,
): Promise<SessionResult<FollowStatusDto>> {
  return withSession((client, cookie) =>
    client.get({
      path: `${targetPath(targetType, targetId)}/status`,
      schema: followStatusDtoSchema,
      headers: { cookie },
    }),
  );
}

export function followTarget(
  targetType: FollowTargetTypeDto,
  targetId: string,
): Promise<SessionResult<unknown>> {
  return withSession((client, cookie) =>
    client.post({
      path: '/api/v2/follows',
      body: { targetType, targetId },
      schema: followDtoSchema,
      headers: { cookie },
    }),
  );
}

export function unfollowTarget(
  targetType: FollowTargetTypeDto,
  targetId: string,
): Promise<SessionResult<unknown>> {
  return withSession((client, cookie) =>
    client.delete({
      path: targetPath(targetType, targetId),
      schema: noContentSchema,
      headers: { cookie },
    }),
  );
}

export function listMyFollows(input: {
  readonly cursor?: string | undefined;
  readonly limit?: number;
}): Promise<SessionResult<FollowListResponse>> {
  return withSession((client, cookie) =>
    client.get({
      path: '/api/v2/follows/me',
      query: { cursor: input.cursor, limit: input.limit ?? 20 },
      schema: followListResponseSchema,
      headers: { cookie },
    }),
  );
}

export function listMyNotifications(input: {
  readonly cursor?: string | undefined;
  readonly unreadOnly?: boolean;
  readonly limit?: number;
}): Promise<SessionResult<NotificationListResponse>> {
  return withSession((client, cookie) =>
    client.get({
      path: '/api/v2/notifications/me',
      query: {
        cursor: input.cursor,
        limit: input.limit ?? 20,
        unreadOnly: input.unreadOnly === true ? 'true' : undefined,
      },
      schema: notificationListResponseSchema,
      headers: { cookie },
    }),
  );
}

export async function getUnreadNotificationCount(): Promise<SessionResult<number>> {
  const result = await withSession((client, cookie) =>
    client.get({
      path: '/api/v2/notifications/me/unread-count',
      schema: unreadCountDtoSchema,
      headers: { cookie },
    }),
  );
  return result.status === 'ok' ? { status: 'ok', data: result.data.count } : result;
}

export function markNotificationsRead(ids: readonly string[]): Promise<SessionResult<number>> {
  return withSession(async (client, cookie) => {
    const result = await client.post({
      path: '/api/v2/notifications/me/read',
      body: { ids },
      schema: markReadResultDtoSchema,
      headers: { cookie },
    });
    return result.updated;
  });
}

export function markAllNotificationsRead(): Promise<SessionResult<number>> {
  return withSession(async (client, cookie) => {
    const result = await client.post({
      path: '/api/v2/notifications/me/read-all',
      body: null,
      schema: markReadResultDtoSchema,
      headers: { cookie },
    });
    return result.updated;
  });
}

export interface FollowTargetSummary {
  readonly name: string;
  readonly href: string;
}

async function readPublic<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
  try {
    return await createApiClient({ maxRetries: 0, timeoutMs: 3_000 }).get({ path, schema });
  } catch {
    return null;
  }
}

/**
 * Resolves a follow edge's target id to a display name and profile link via
 * the public by-id lookups. `null` when the target is gone or unpublished —
 * the edge still exists, so the list shows it as unavailable rather than
 * silently dropping it.
 */
export async function resolveFollowTarget(
  targetType: FollowTargetTypeDto,
  targetId: string,
): Promise<FollowTargetSummary | null> {
  if (targetType === 'venue') {
    const venue = await readPublic(
      `/api/v2/public/venues/by-id/${encodeURIComponent(targetId)}`,
      venueDtoSchema,
    );
    return venue === null ? null : { name: venue.name, href: `/venue/${venue.slug}` };
  }

  const host = await readPublic(
    `/api/v2/public/hosts/by-id/${encodeURIComponent(targetId)}`,
    hostPublicDtoSchema,
  );
  return host === null ? null : { name: host.name, href: `/host/${host.slug}` };
}
