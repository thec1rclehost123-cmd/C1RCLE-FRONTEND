'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';

import { followTargetParamsSchema } from '@c1rcle/contracts';

import {
  followTarget,
  getFollowStatus,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationsRead,
  unfollowTarget,
} from '@/lib/social/social-api';

import type { FollowTargetTypeDto } from '@c1rcle/contracts';

/*
 * Server Actions are reachable by direct POST, so every input is re-validated
 * here and the gateway still authorizes each call against the forwarded
 * session cookie. These return UI states, never throw, so a client button can
 * roll back its optimistic state on failure.
 */

export type FollowActionResult =
  | { readonly status: 'ok'; readonly following: boolean; readonly followerCount: number | null }
  | { readonly status: 'unauthenticated' }
  | { readonly status: 'error' };

const notificationIdsSchema = z.array(z.string().min(1).max(256)).min(1).max(100);

export async function setFollowingAction(
  targetType: FollowTargetTypeDto,
  targetId: string,
  following: boolean,
): Promise<FollowActionResult> {
  const params = followTargetParamsSchema.safeParse({ targetType, targetId });
  if (!params.success || typeof following !== 'boolean') return { status: 'error' };

  const command = following ? followTarget : unfollowTarget;
  const result = await command(params.data.targetType, params.data.targetId);
  if (result.status === 'unauthenticated') return { status: 'unauthenticated' };
  if (result.status === 'unavailable') return { status: 'error' };

  const status = await getFollowStatus(params.data.targetType, params.data.targetId);
  // The command landed; if the re-read fails, report the intended state
  // without a count rather than rolling back a successful follow.
  return status.status === 'ok'
    ? { status: 'ok', ...status.data }
    : { status: 'ok', following, followerCount: null };
}

export async function getUnreadCountAction(): Promise<number | null> {
  const result = await getUnreadNotificationCount();
  return result.status === 'ok' ? result.data : null;
}

export async function markNotificationsReadAction(ids: readonly string[]): Promise<boolean> {
  const parsed = notificationIdsSchema.safeParse(ids);
  if (!parsed.success) return false;
  const result = await markNotificationsRead(parsed.data);
  if (result.status !== 'ok') return false;
  refresh();
  return true;
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const result = await markAllNotificationsRead();
  if (result.status === 'ok') refresh();
}
