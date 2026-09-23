import type { NotificationSurface } from './notifications-surface';
import type { NotificationActionTypeDto, NotificationDto } from '@c1rcle/contracts';

export type NotificationCategory = 'events' | 'partners' | 'finance' | 'system';

export interface NotificationView {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  /** Human label derived from `createdAt` (e.g. "Today, 10:24 AM"). */
  readonly time: string;
  readonly category: NotificationCategory;
  readonly unread: boolean;
  readonly destination: string | null;
  /** Non-null when this notification carries an approve/reject quick action. */
  readonly resourceType: NotificationActionTypeDto | null;
  readonly decisionSupported: boolean;
}

/** Partitions every known producer type into the center-screen categories. */
export function notificationCategoryOf(dto: NotificationDto): NotificationCategory {
  if (
    dto.type.startsWith('event.') ||
    dto.type.startsWith('promoter_assignment.') ||
    dto.type.startsWith('slot_request')
  ) {
    return 'events';
  }
  if (dto.type.startsWith('promoter_connection') || dto.type.startsWith('partnership')) {
    return 'partners';
  }
  if (dto.type.startsWith('finance')) {
    return 'finance';
  }
  return 'system';
}

/**
 * Best-effort deep link for a notification. Derived from the action's
 * `resourceType` (the actionable surface) or the producer type, scoped to the
 * recipient's workspace. `null` means "no destination yet" and the surface
 * renders the row without a link.
 */
export function notificationDestination(
  dto: NotificationDto,
  surface: NotificationSurface,
): string | null {
  const resource = dto.action?.resourceType ?? resourceTypeFromType(dto.type);

  if (resource === 'promoter_connection' || resource === 'partnership') {
    return partnersDestination(surface);
  }
  if (resource === 'slot_request') {
    if (surface === 'venue') return '/venue/slot-requests';
    if (surface === 'host') return '/host/events?tab=requests';
    return null;
  }
  if (dto.type.startsWith('event.') || dto.type.startsWith('promoter_assignment.')) {
    if (surface === 'venue') return '/venue/events';
    if (surface === 'host') return '/host/events';
    return '/promoter/events';
  }
  return null;
}

function resourceTypeFromType(type: string): NotificationActionTypeDto | null {
  if (type.startsWith('promoter_connection')) return 'promoter_connection';
  if (type.startsWith('partnership')) return 'partnership';
  if (type.startsWith('slot_request')) return 'slot_request';
  return null;
}

function partnersDestination(surface: NotificationSurface): string {
  if (surface === 'host') return '/host/partners';
  if (surface === 'promoter') return '/promoter/partners';
  return '/venue/partners';
}

export function notificationTimeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86_400_000);
  const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(
    date,
  );

  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Yesterday, ${time}`;
  if (dayDiff < 7) {
    return new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(date);
  }
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
}

export function toNotificationView(
  dto: NotificationDto,
  surface: NotificationSurface,
): NotificationView {
  return {
    id: dto.id,
    title: dto.title,
    summary: dto.body,
    time: notificationTimeLabel(dto.createdAt),
    category: notificationCategoryOf(dto),
    unread: !dto.read,
    destination: notificationDestination(dto, surface),
    resourceType: dto.action?.resourceType ?? null,
    decisionSupported: dto.action !== null,
  };
}
