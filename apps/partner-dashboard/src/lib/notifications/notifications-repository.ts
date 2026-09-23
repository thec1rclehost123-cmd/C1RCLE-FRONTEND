import {
  markAllNotificationsReadResultSchema,
  notificationActionRequestSchema,
  notificationDtoSchema,
  notificationsListResponseSchema,
} from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/onboarding/csrf';

import type {
  MarkAllNotificationsReadResult,
  NotificationActionRequestDto,
  NotificationDecisionDto,
  NotificationDto,
  NotificationsListResponse,
} from '@c1rcle/contracts';

/**
 * Org-scoped notification inbox client. Every call goes through the
 * same-origin BFF (`/api/bff/organizations/:id/notifications...`), which
 * forwards the browser's httpOnly session cookie to the gateway and enforces
 * the CSRF check — so no bearer token, org header, or idempotency key is ever
 * minted here. Mark-read is idempotent server-side; read-all and quick actions
 * have their idempotency keys minted inside the BFF routes.
 */
export async function listNotifications(
  organizationId: string,
  options?: { readonly limit?: number; readonly cursor?: string },
): Promise<NotificationsListResponse> {
  return bffClient.get({
    path: `/api/bff/organizations/${organizationId}/notifications`,
    query: {
      ...(options?.limit !== undefined ? { limit: options.limit } : {}),
      ...(options?.cursor !== undefined ? { cursor: options.cursor } : {}),
    },
    schema: notificationsListResponseSchema,
  });
}

export async function markAllNotificationsRead(
  organizationId: string,
): Promise<MarkAllNotificationsReadResult> {
  return bffClient.patch({
    path: `/api/bff/organizations/${organizationId}/notifications/read-all`,
    schema: markAllNotificationsReadResultSchema,
    headers: csrfHeaders(),
  });
}

export async function markNotificationRead(
  organizationId: string,
  notificationId: string,
): Promise<NotificationDto> {
  return bffClient.patch({
    path: `/api/bff/organizations/${organizationId}/notifications/${notificationId}/read`,
    schema: notificationDtoSchema,
    headers: csrfHeaders(),
  });
}

export async function performNotificationAction(
  organizationId: string,
  notificationId: string,
  decision: NotificationDecisionDto,
): Promise<NotificationDto> {
  const body = notificationActionRequestSchema.parse({
    decision,
  }) satisfies NotificationActionRequestDto;
  return bffClient.post({
    path: `/api/bff/organizations/${organizationId}/notifications/${notificationId}/actions`,
    body,
    schema: notificationDtoSchema,
    headers: csrfHeaders(),
  });
}
