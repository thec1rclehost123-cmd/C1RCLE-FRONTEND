import {
  markAllNotificationsReadResultSchema,
  notificationDtoSchema,
  notificationsListResponseSchema,
} from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/onboarding/csrf';

import type { NotificationDto, NotificationsListResponse } from '@c1rcle/contracts';

export function loadPartnerInbox(
  organizationId: string,
  limit: number,
  cursor?: string | null,
): Promise<NotificationsListResponse> {
  return bffClient.get({
    path: '/api/bff/partner-inbox',
    query: { organizationId, limit, ...(cursor ? { cursor } : {}) },
    schema: notificationsListResponseSchema,
  });
}

export function markPartnerNotificationRead(
  organizationId: string,
  notificationId: string,
): Promise<NotificationDto> {
  return bffClient.patch({
    path: '/api/bff/partner-inbox',
    body: { organizationId, notificationId },
    schema: notificationDtoSchema,
    headers: csrfHeaders(),
  });
}

export function markAllPartnerNotificationsRead(
  organizationId: string,
): Promise<{ readonly selected: number }> {
  return bffClient.patch({
    path: '/api/bff/partner-inbox',
    body: { organizationId, readAll: true },
    schema: markAllNotificationsReadResultSchema,
    headers: csrfHeaders(),
  });
}
