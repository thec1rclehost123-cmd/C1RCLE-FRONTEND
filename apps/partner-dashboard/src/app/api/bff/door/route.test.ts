import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { csrfCookieName, forwardToGateway } from '@/lib/bff/auth-proxy';

import { POST } from './route';

vi.mock('@/lib/bff/auth-proxy', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest mock factory
  const actual = await importOriginal<typeof import('@/lib/bff/auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn() };
});

const mockForward = vi.mocked(forwardToGateway);
const origin = 'http://localhost:3001';

function request(body: unknown) {
  return new NextRequest(`${origin}/api/bff/door`, {
    method: 'POST',
    headers: {
      origin,
      cookie: `better-auth.session_token=sess_abc; ${csrfCookieName()}=csrf-token`,
      'x-csrf-token': 'csrf-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => mockForward.mockReset());
afterEach(() => vi.restoreAllMocks());

describe('/api/bff/door', () => {
  it('keeps organization and scanner credentials in authorized headers when opening a shift', async () => {
    mockForward.mockResolvedValue(
      new Response(
        JSON.stringify({
          sessionId: 'sess_1',
          sessionToken: 'scanner-secret',
          sessionExpiresAt: '2026-10-28T22:00:00.000Z',
          event: {
            id: 'evt_1',
            title: 'Night Out',
            slug: 'night-out',
            venueId: 'venue_1',
            startAt: '2026-10-28T20:00:00.000Z',
            endAt: null,
            status: 'published',
            capacity: 100,
          },
          permissions: { canScan: true, canDoorEntry: true, canWalkIn: false, canCharge: false },
          gate: 'Front',
          tiers: [],
          stats: {
            eventId: 'evt_1',
            occupancy: { inside: 0, capacity: 100, remaining: 100, prebooked: 0, doorEntries: 0 },
            byEntryType: {},
            scans: {
              total: 0,
              consumed: 0,
              denied: 0,
              pending: 0,
              revoked: 0,
              expired: 0,
              cancelled: 0,
              overridden: 0,
            },
            doorSales: { count: 0, grossPaise: 0 },
            coverWallet: {
              activeWallets: 0,
              totalBalancePaise: 0,
              totalCreditsPaise: 0,
              totalDebitsPaise: 0,
            },
            generatedAt: '2026-10-28T19:00:00.000Z',
          },
          device: { deviceId: 'device_1', deviceName: 'Door device' },
        }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      ),
    );

    const response = await POST(
      request({
        operation: 'start',
        organizationId: 'org_1',
        idempotencyKey: 'door-start-123',
        eventId: 'evt_1',
        code: 'venue-code',
        deviceId: 'device_1',
        deviceName: 'Door device',
        sessionType: 'staff',
      }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mockForward.mock.calls[0]?.[0]).toBe('/api/v2/door/sessions');
    expect(mockForward.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: {
        'x-organization-id': 'org_1',
        'idempotency-key': 'door-start-123',
      },
      body: {
        eventId: 'evt_1',
        code: 'venue-code',
        deviceId: 'device_1',
        sessionType: 'staff',
      },
    });
    expect(mockForward.mock.calls[0]?.[1].body).not.toHaveProperty('organizationId');
    expect(mockForward.mock.calls[0]?.[1].body).not.toHaveProperty('idempotencyKey');
  });

  it('rejects cross-origin and CSRF-invalid commands before gateway access', async () => {
    const crossOrigin = new NextRequest(`${origin}/api/bff/door`, {
      method: 'POST',
      headers: { origin: 'https://example.invalid', 'content-type': 'application/json' },
      body: '{}',
    });
    const denied = await POST(crossOrigin);
    expect(denied.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('binds restricted admission to the scanner-session header and stable idempotency key', async () => {
    mockForward.mockResolvedValue(
      new Response(JSON.stringify({ status: 'consumed', checkInId: 'scan_1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await POST(
      request({
        operation: 'scan',
        organizationId: 'org_1',
        idempotencyKey: 'scan-attempt-123',
        sessionToken: 'scanner-secret',
        eventId: 'evt_1',
        qrPayload: 'ticket-qr',
        eligibilityVerified: true,
      }),
    );

    expect(response.status).toBe(200);
    expect(mockForward.mock.calls[0]?.[0]).toBe('/api/v2/door/check-ins');
    expect(mockForward.mock.calls[0]?.[1]).toMatchObject({
      headers: {
        'x-organization-id': 'org_1',
        'x-scanner-session-token': 'scanner-secret',
        'idempotency-key': 'scan-attempt-123',
      },
      body: { eventId: 'evt_1', qrPayload: 'ticket-qr', eligibilityVerified: true },
    });
    expect(mockForward.mock.calls[0]?.[1].body).not.toHaveProperty('sessionToken');
    expect(mockForward.mock.calls[0]?.[1].body).not.toHaveProperty('organizationId');
  });

  it('forwards ticket-extra redemption with scanner credentials and validates its response', async () => {
    mockForward.mockResolvedValue(
      new Response(
        JSON.stringify({
          entitlementId: 'ent_1',
          addon: {
            id: 'addon_ent_1',
            addonId: 'addon_1',
            name: 'Parking',
            kind: 'parking',
            unitPricePaise: 500,
            status: 'redeemed',
            createdAt: '2026-10-28T19:00:00.000Z',
            redeemedAt: '2026-10-28T19:30:00.000Z',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const response = await POST(
      request({
        operation: 'redeemAddon',
        organizationId: 'org_1',
        idempotencyKey: 'addon-redeem-123',
        sessionToken: 'scanner-secret',
        eventId: 'evt_1',
        entitlementId: 'ent_1',
        addonEntitlementId: 'addon_ent_1',
      }),
    );

    expect(response.status).toBe(200);
    expect(mockForward.mock.calls[0]?.[0]).toBe('/api/v2/door/ticket-addons/redeem');
    expect(mockForward.mock.calls[0]?.[1]).toMatchObject({
      headers: {
        'x-organization-id': 'org_1',
        'x-scanner-session-token': 'scanner-secret',
        'idempotency-key': 'addon-redeem-123',
      },
      body: { eventId: 'evt_1', entitlementId: 'ent_1', addonEntitlementId: 'addon_ent_1' },
    });
    expect(mockForward.mock.calls[0]?.[1].body).not.toHaveProperty('sessionToken');
  });
});
