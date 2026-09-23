/**
 * The dashboard workspace surface a notification is shown on. Mirrors the
 * gateway's `recipientType` vocabulary (`venue` | `host` | `promoter`) and the
 * partner shell's `partnerRole`.
 */
export type NotificationSurface = 'venue' | 'host' | 'promoter';

export function isNotificationSurface(value: string): value is NotificationSurface {
  return value === 'venue' || value === 'host' || value === 'promoter';
}
