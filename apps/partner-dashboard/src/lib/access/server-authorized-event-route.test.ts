import { describe, expect, it } from 'vitest';

import { isServerAuthorizedPartnerEventRoute } from './server-authorized-event-route';

describe('isServerAuthorizedPartnerEventRoute', () => {
  it.each([
    '/partner/venue/events/event_m3',
    '/partner/host/events/event_m3',
    '/partner/venue/events/event_m3/analytics',
    '/partner/venue/events/event_m3/sales',
    '/partner/host/events/event_m3/guests',
    '/partner/venue/events/event_m3/promoters',
  ])('allows server-authorized event route %s', (pathname) => {
    expect(isServerAuthorizedPartnerEventRoute(pathname)).toBe(true);
  });

  it.each([
    null,
    '/partner/venue/events',
    '/partner/venue/events/create',
    '/partner/venue/events/event_m3/edit',
    '/partner/promoter/events/event_m3',
    '/partner/venue/events/event_m3/unknown',
    '/venue/events/event_m3',
  ])('does not bypass client authorization for %s', (pathname) => {
    expect(isServerAuthorizedPartnerEventRoute(pathname)).toBe(false);
  });
});
