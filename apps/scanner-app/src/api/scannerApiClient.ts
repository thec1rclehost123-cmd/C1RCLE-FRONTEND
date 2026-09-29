import { z } from 'zod';

import { ApiClient } from '@c1rcle/api-client';


import { getSessionMeta, getSessionToken } from '@/auth/scannerSession';
import { getOrganizationId, getStaffAccessToken } from '@/auth/staffAuth';
import { getScannerEnv } from '@/config/env';

import {
  checkInResultSchema,
  doorEventsResponseSchema,
  doorSaleSchema,
  doorSalesResponseSchema,
  doorSessionResponseSchema,
  doorStatsSchema,
  guestListResponseSchema,
  loginResponseSchema,
  manualCheckInResponseSchema,
  organizationListResponseSchema,
  overrideResponseSchema,
  scannerDeviceSchema,
  staffDenyResponseSchema,
  ticketLookupResultSchema,
  ticketSaleResponseSchema,
  walletChargeResponseSchema,
  walletQrResponseSchema,
} from './schemas';

import type {
  CheckInResult,
  DoorEvent,
  DoorSale,
  DoorSessionResponse,
  DoorStats,
  Guest,
  ManualCheckInResponse,
  Organization,
  OverrideResponse,
  PaymentMode,
  StaffDenyResponse,
  TicketLookupResult,
  TicketSaleResponse,
  WalletChargeResponse,
  WalletQrResponse,
} from './schemas';

let client: ApiClient | null = null;

/**
 * The one HTTP client for this app, wrapping `@c1rcle/api-client` (confirmed
 * platform-agnostic — no DOM/browser APIs). `getToken` supplies the staff
 * access token for the `Authorization` header the base client already
 * knows how to attach; `X-Organization-Id` and `X-Scanner-Session-Token`
 * are NOT something the base client knows about, so every call below adds
 * them itself via `headers`.
 */
function getClient(): ApiClient {
  client ??= new ApiClient({
    baseUrl: getScannerEnv().apiBaseUrl,
    getToken: () => getStaffAccessToken(),
    // Refresh strategy is the open Phase 0 question in
    // docs/scanner-app/06-v1-vs-v2-and-rollout.md — until resolved, a 401
    // simply fails; there is no silent reauth attempt to get wrong.
  });
  return client;
}

function withOrgHeader(extra?: Record<string, string>): Record<string, string> {
  const orgId = getOrganizationId();
  return {
    ...(orgId !== null ? { 'x-organization-id': orgId } : {}),
    ...extra,
  };
}

async function withSessionHeader(): Promise<Record<string, string>> {
  const token = await getSessionToken();
  const orgHeaders = withOrgHeader();
  return {
    ...orgHeaders,
    ...(token !== null ? { 'x-scanner-session-token': token } : {}),
  };
}

export async function login(email: string, password: string): Promise<{
  accessToken: string;
  expiresAt: number;
  user: { id: string; email: string; displayName: string | null; role: string };
}> {
  return getClient().post({
    path: '/api/v2/auth/login',
    body: { email, password },
    schema: loginResponseSchema,
  });
}

/**
 * The venues this staff account actually belongs to — the backend returns
 * active memberships only, so a stale or revoked org simply isn't listed.
 *
 * `accessToken` is passed explicitly and used as the `authorization` header
 * rather than read from the session, because this runs immediately after
 * `login()` and before `setStaffSession()` has stored anything. `ApiClient`
 * spreads per-request `headers` last, so this overrides the (still-null)
 * `getToken()` result rather than duplicating the header.
 *
 * No `x-organization-id` is sent: this call is what discovers the org, so it
 * cannot already have one. The route is gated on the session-only actor.
 */
export async function fetchMyOrganizations(accessToken: string): Promise<Organization[]> {
  const result = await getClient().get({
    path: '/api/v2/organizations',
    headers: { authorization: `Bearer ${accessToken}` },
    schema: organizationListResponseSchema,
  });
  return result.items;
}

export async function fetchTodaysEvents(organizationId: string): Promise<DoorEvent[]> {
  const result = await getClient().get({
    path: '/api/v2/door/events',
    query: { date: 'today' },
    headers: withOrgHeader({ 'x-organization-id': organizationId }),
    schema: doorEventsResponseSchema,
  });
  return result.items;
}

export async function registerDevice(deviceId: string, deviceName: string): Promise<void> {
  await getClient().post({
    path: '/api/v2/door/devices',
    body: { deviceId, deviceName },
    headers: withOrgHeader(),
    schema: scannerDeviceSchema,
  });
}

export async function redeemDoorCode(input: {
  eventId: string;
  code: string;
  deviceId: string;
  deviceName: string;
  sessionType: 'staff' | 'device';
  /** D-030: optional GPS fix for the server's soft venue geofence. */
  deviceLocation?: { lat: number; lng: number };
}): Promise<DoorSessionResponse> {
  return getClient().post({
    path: '/api/v2/door/sessions',
    body: input,
    headers: withOrgHeader(),
    schema: doorSessionResponseSchema,
  });
}

export async function checkIn(input: {
  eventId: string;
  qrPayload: string;
  operatorName?: string;
  gate?: string | null;
}): Promise<CheckInResult> {
  return getClient().post({
    path: '/api/v2/door/check-ins',
    body: input,
    headers: await withSessionHeader(),
    schema: checkInResultSchema,
  });
}

/**
 * `POST /door/lookup` — resolves a ticket without spending it. The default
 * scan flow calls this first and shows a confirm sheet (`VALID TICKET —
 * tap admit to check in`); `checkIn` above only runs once staff actually
 * taps admit, unless "Auto-admit valid tickets" is on, in which case the
 * caller skips straight to `checkIn`.
 */
export async function lookupTicket(input: {
  eventId: string;
  qrPayload: string;
}): Promise<TicketLookupResult> {
  return getClient().post({
    path: '/api/v2/door/lookup',
    body: input,
    headers: await withSessionHeader(),
    schema: ticketLookupResultSchema,
  });
}

export async function confirmCheckIn(input: {
  eventId: string;
  confirmationToken: string;
  confirmed: boolean;
  operatorName?: string;
}): Promise<CheckInResult> {
  return getClient().post({
    path: '/api/v2/door/check-ins/confirm',
    body: input,
    headers: await withSessionHeader(),
    schema: checkInResultSchema,
  });
}

export async function fetchStats(eventId: string): Promise<DoorStats> {
  return getClient().get({
    path: '/api/v2/door/stats',
    query: { eventId },
    headers: await withSessionHeader(),
    schema: doorStatsSchema,
  });
}

export interface StatsStreamHandlers {
  onStats: (stats: DoorStats) => void;
  /** Fired on `event: closed` (access revoked, event gone, or the server's
   * bounded stream lifetime expired) and on a network-level drop. The
   * stream does not auto-reconnect — Phase 4's contract doc calls a stream
   * a bounded credential, not a subscription, so the caller decides whether
   * and when to reopen rather than this client silently retrying forever. */
  onClosed?: (reason: string) => void;
}

/**
 * `GET /door/stats/stream` (Server-Sent Events) — see `phase5-routes.ts`
 * for the full rationale (SSE over WebSocket, one nginx line, why headers
 * matter). Built on `ApiClient.openEventStream`, not a bare `EventSource`:
 * `EventSource` cannot attach the `Authorization`/`X-Organization-Id`
 * headers this endpoint requires — that is the exact credential-leak-via-
 * query-string class SSE was chosen to avoid — and every network call in
 * this repo goes through `@c1rcle/api-client` regardless.
 *
 * `timeoutMs` is set well above the server's own 15-minute bounded stream
 * lifetime (`phase5-routes.ts`'s `MAX_STREAM_MS`) so the client's own
 * connection timeout never fires first and gets misread as a drop.
 *
 * Returns a `close()` function; the caller owns the connection's lifetime
 * (call it on unmount, same as `clearInterval` for the poll it replaces).
 */
export function openStatsStream(eventId: string, handlers: StatsStreamHandlers): { close: () => void } {
  const handle = getClient().openEventStream(
    {
      path: '/api/v2/door/stats/stream',
      query: { eventId },
      headers: withOrgHeader(),
      timeoutMs: 20 * 60 * 1000,
    },
    (event, data) => {
      if (event === 'stats') {
        try {
          handlers.onStats(doorStatsSchema.parse(JSON.parse(data)));
        } catch {
          // A frame that fails schema validation is dropped, not fatal —
          // the next tick (3s later, per the server) supersedes it anyway.
        }
      } else if (event === 'closed') {
        handlers.onClosed?.(parseCloseReason(data));
      }
    },
    (reason) => {
      handlers.onClosed?.(reason === 'done' ? 'disconnected' : 'error');
    },
  );
  return { close: handle.close };
}

function parseCloseReason(data: string): string {
  try {
    const parsed: unknown = JSON.parse(data);
    return typeof parsed === 'object' && parsed !== null && 'reason' in parsed
      ? String(parsed.reason)
      : 'closed';
  } catch {
    return 'closed';
  }
}

/** `docs/api-contracts/scanner-app.md` §"guests roster" — server-side
 * filter/search/limit, no `cursor`; sorted not-entered first. */
export async function fetchGuests(input: {
  eventId: string;
  search?: string;
  status?: 'entered' | 'not_entered';
}): Promise<{ items: Guest[]; truncated: boolean }> {
  return getClient().get({
    path: '/api/v2/door/guests',
    query: { eventId: input.eventId, search: input.search, status: input.status },
    headers: await withSessionHeader(),
    schema: guestListResponseSchema,
  });
}

/** For a cracked screen or dead phone. Requires `ticket.override` — a
 * role-level right, not a per-session one — so callers must check
 * `canOverride(getStaffUser()?.role)` before offering this in the UI; the
 * server enforces it regardless and returns 403 if the role lacks it. */
export async function manualCheckIn(entitlementId: string, eventId: string): Promise<ManualCheckInResponse> {
  return getClient().post({
    path: '/api/v2/door/guests/check-in',
    body: { entitlementId, eventId },
    headers: await withSessionHeader(),
    schema: manualCheckInResponseSchema,
  });
}

/** Physically refusing someone whose ticket scanned fine (or who never
 * presented one — `qrPayload` is optional). Does NOT spend the ticket. */
export async function staffDeny(input: {
  eventId: string;
  reason: string;
  qrPayload?: string;
  gate?: string | null;
}): Promise<StaffDenyResponse> {
  return getClient().post({
    path: '/api/v2/door/staff-deny',
    body: input,
    headers: await withSessionHeader(),
    schema: staffDenyResponseSchema,
  });
}

/** Admits a previously DENIED scan. `SENSITIVE_COMMAND` (10/min) and
 * `ticket.override` — same permission as `manualCheckIn`. 409 if the
 * target checkInId isn't currently `denied`. */
export async function overrideCheckIn(input: { checkInId: string; reason: string }): Promise<OverrideResponse> {
  return getClient().post({
    path: '/api/v2/door/override',
    body: input,
    headers: await withSessionHeader(),
    schema: overrideResponseSchema,
  });
}

/**
 * Walk-in / dine-in body per the contract (§9). `totalGuests` is the party
 * size and is **what gets priced**, so it is required on both — not just
 * dine-in — and `paymentMode` is required too; both were previously omitted.
 * Sending `tierId` or `quantity` here is a 422: headcount entries price off
 * the event's own walk-in/dine-in tier, and choosing a tier is what
 * `submitTicketSale` is for.
 */
interface DoorSaleEntryInput {
  eventId: string;
  guestName: string;
  totalGuests: number;
  paymentMode: PaymentMode;
  guestPhone?: string;
  guestEmail?: string;
  guestAge?: number;
  gender?: 'male' | 'female' | 'other' | 'undisclosed';
  gate?: string | null;
  tableNumber?: string;
  idempotencyKey: string;
}

/** `+idem` per the contract (docs/api-contracts/scanner-app.md §4) — the caller mints one key per tap, reused on every retry of that same tap, never a new key per network attempt. */
export async function submitWalkIn(input: DoorSaleEntryInput): Promise<DoorSale> {
  return getClient().post({
    path: '/api/v2/door/walk-in',
    body: input,
    headers: await withSessionHeader(),
    schema: doorSaleSchema,
  });
}

export async function submitDineIn(input: DoorSaleEntryInput): Promise<DoorSale> {
  return getClient().post({
    path: '/api/v2/door/dine-in',
    body: input,
    headers: await withSessionHeader(),
    schema: doorSaleSchema,
  });
}

/**
 * Paid walk-up sale — a **real order** through the shared checkout path
 * (`05-cover-wallet-door-sales.md` D2), not a door-only ledger. No price
 * field exists: the tier determines it server-side.
 */
export async function submitTicketSale(input: {
  eventId: string;
  tierId: string;
  quantity: number;
  paymentMode: PaymentMode;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  guestAge?: number;
  gender?: 'male' | 'female' | 'other' | 'undisclosed';
  gate?: string | null;
  idempotencyKey: string;
}): Promise<TicketSaleResponse> {
  return getClient().post({
    path: '/api/v2/door/ticket-sale',
    body: input,
    headers: await withSessionHeader(),
    schema: ticketSaleResponseSchema,
  });
}

/** Resolves a rotating signed cover-wallet QR. Read-only, no idempotency. */
export async function resolveWalletQr(eventId: string, qrPayload: string): Promise<WalletQrResponse> {
  return getClient().post({
    path: '/api/v2/door/wallet-qr',
    body: { eventId, qrPayload },
    headers: await withSessionHeader(),
    schema: walletQrResponseSchema,
  });
}

/**
 * Debits a preset-priced item. There is deliberately no amount parameter —
 * the client can only name a `presetItemId` and the server resolves the
 * price (SOTA-10). Takes the QR rather than a saved wallet id, because a
 * charge must always follow a tab physically presented.
 */
export async function chargeWallet(input: {
  eventId: string;
  qrPayload: string;
  presetItemId: string;
  quantity: number;
  idempotencyKey: string;
}): Promise<WalletChargeResponse> {
  return getClient().post({
    path: '/api/v2/door/wallet-charge',
    body: input,
    headers: await withSessionHeader(),
    schema: walletChargeResponseSchema,
  });
}

export async function fetchDoorSales(eventId: string, category: 'walkin' | 'dinein'): Promise<DoorSale[]> {
  const result = await getClient().get({
    path: '/api/v2/door/sales',
    query: { eventId, category },
    headers: await withSessionHeader(),
    schema: doorSalesResponseSchema,
  });
  return result.items;
}

const emptyResponseSchema = z.unknown();

/**
 * `eventId` is required by the contract (`scannerHeartbeatBodySchema` is
 * `.strict()`, no default) — sending `{}` 422s on every single call,
 * confirmed by a direct reproduction against the real backend. This was
 * never actually succeeding; `useHeartbeat`'s missing `.catch()` is a
 * separate bug (below) that's why it was silent instead of visibly always
 * failing.
 */
export async function sendHeartbeat(): Promise<void> {
  const meta = await getSessionMeta();
  if (meta === null) return;
  await getClient().post({
    path: '/api/v2/door/heartbeat',
    body: { eventId: meta.event.id, ...(meta.gate === null ? {} : { gate: meta.gate }) },
    headers: await withSessionHeader(),
    schema: emptyResponseSchema,
  });
}
