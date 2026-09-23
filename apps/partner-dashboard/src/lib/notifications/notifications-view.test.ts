import { describe, expect, it } from 'vitest';

import {
  notificationCategoryOf,
  notificationDestination,
  notificationTimeLabel,
  toNotificationView,
} from './notifications-view';

import type { NotificationDto } from '@c1rcle/contracts';

function dto(overrides: Partial<NotificationDto> = {}): NotificationDto {
  return {
    id: 'n-1',
    recipientId: 'org-1',
    recipientType: 'venue',
    type: 'partnership.requested',
    title: 'New partnership request',
    body: 'Skyline Rooftop wants to partner with you.',
    read: false,
    readAt: null,
    data: {},
    action: { resourceType: 'partnership', resourceId: 'p-1' },
    priority: 'normal',
    createdAt: '2026-09-22T04:54:00.000Z',
    ...overrides,
  };
}

describe('notificationCategoryOf', () => {
  it('maps producer types into the center-screen categories', () => {
    expect(notificationCategoryOf(dto({ type: 'event.published' }))).toBe('events');
    expect(notificationCategoryOf(dto({ type: 'slot_request.requested' }))).toBe('events');
    expect(notificationCategoryOf(dto({ type: 'promoter_connection.requested' }))).toBe('partners');
    expect(notificationCategoryOf(dto({ type: 'partnership.requested' }))).toBe('partners');
    expect(notificationCategoryOf(dto({ type: 'finance.payout_ready' }))).toBe('finance');
    expect(notificationCategoryOf(dto({ type: 'system.reminder' }))).toBe('system');
  });
});

describe('notificationDestination', () => {
  it('routes quick-action resources to the surface partners page', () => {
    expect(notificationDestination(dto(), 'venue')).toBe('/venue/partners');
    expect(notificationDestination(dto(), 'host')).toBe('/host/partners');
    expect(notificationDestination(dto(), 'promoter')).toBe('/promoter/partners');
  });

  it('routes slot requests and event publications by surface', () => {
    const slot = dto({ type: 'slot_request.requested', action: null });
    expect(notificationDestination(slot, 'venue')).toBe('/venue/slot-requests');
    expect(notificationDestination(slot, 'host')).toBe('/host/events?tab=requests');
    expect(notificationDestination(slot, 'promoter')).toBeNull();

    const published = dto({ type: 'event.published', action: null });
    expect(notificationDestination(published, 'venue')).toBe('/venue/events');
    expect(notificationDestination(published, 'host')).toBe('/host/events');
    expect(notificationDestination(published, 'promoter')).toBe('/promoter/events');
  });

  it('returns null for unknown producer types', () => {
    expect(
      notificationDestination(dto({ type: 'system.unknown', action: null }), 'venue'),
    ).toBeNull();
  });
});

describe('notificationTimeLabel', () => {
  it('formats today and yesterday relative labels', () => {
    const today = new Date();
    const todayIso = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      10,
      24,
    ).toISOString();
    expect(notificationTimeLabel(todayIso)).toMatch(/^Today, 10:24/);

    const yesterday = new Date(today.getTime() - 86_400_000);
    const yesterdayIso = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      9,
      5,
    ).toISOString();
    expect(notificationTimeLabel(yesterdayIso)).toMatch(/^Yesterday, 9:05/);
  });

  it('falls back to an empty label for an invalid date', () => {
    expect(notificationTimeLabel('not-a-date')).toBe('');
  });
});

describe('toNotificationView', () => {
  it('projects a DTO into the surface display shape', () => {
    const source = dto();
    const view = toNotificationView(source, 'venue');
    expect(view).toMatchObject({
      id: source.id,
      title: source.title,
      summary: source.body,
      category: 'partners',
      unread: true,
      destination: '/venue/partners',
      resourceType: 'partnership',
      decisionSupported: true,
    });
    expect(view.time).toBe(notificationTimeLabel(source.createdAt));
  });

  it('marks read DTOs unread=false and nulls the resource for non-actionable rows', () => {
    const view = toNotificationView(
      dto({ read: true, readAt: '2026-09-22T10:00:00.000Z', action: null }),
      'venue',
    );
    expect(view.unread).toBe(false);
    expect(view.resourceType).toBeNull();
    expect(view.decisionSupported).toBe(false);
  });
});
