/*
 * Server-side gateway composer for the slot-request feature. This is the only
 * module on the slot-request path allowed to talk to the gateway (via the
 * sanctioned `forwardToGateway` in `auth-proxy.ts`): the `/api/bff/slot-requests`
 * route handlers are thin wrappers around it, and caller org identity is
 * forwarded server-side only — the browser never sees a gateway URL.
 *
 * GAP notes (honest, never invented data — see `docs/superpowers/
 * FRONTEND-GATEWAY-BACKEND-MAP.md` §5.2):
 *  - Ticket tiers / promos / tables / artists / promoters are catalog reads
 *    that are not part of this slice; the affected UI sections render only when
 *    the wire actually provided something (empty lists are dropped).
 *  - `accepted` (wire) is mapped to `approved` (UI) so the surface keeps its
 *    established status vocabulary.
 */
import { eventEndAtFromDraft, eventStartAtFromDraft } from '@/lib/events/event-time';

import {
  forwardToGateway,
  mintIdempotencyKey,
  parseJson,
} from './auth-proxy';

import type {
  SlotRequest,
  SlotRequestDirection,
  SlotRequestEvent,
  SlotRequestStatus,
  SlotRequestsData,
} from '@/data/partner-data-source';
import type {
  EventDto,
  Paginated,
  SlotRequestDetailDto,
  SlotRequestDto,
  VenueDto,
} from '@c1rcle/contracts';

export interface GatewayContext {
  readonly cookie: string | null;
  readonly headers: Readonly<Record<string, string>>;
}

export class GatewayError extends Error {
  readonly status: number;
  readonly envelope: unknown;

  constructor(status: number, envelope: unknown) {
    const message =
      typeof envelope === 'object' &&
      envelope !== null &&
      typeof (envelope as { message?: unknown }).message === 'string'
        ? String((envelope as { message: unknown }).message)
        : `Gateway responded with status ${String(status)}.`;
    super(message);
    this.name = 'GatewayError';
    this.status = status;
    this.envelope = envelope;
  }
}

/** Forward headers for a gateway call scoped to the requested organization. */
function gatewayHeaders(organizationId: string, ctx: GatewayContext): Record<string, string> {
  return {
    ...ctx.headers,
    'x-organization-id': organizationId,
  };
}

/**
 * The gateway requires an `Idempotency-Key` on every slot-request write
 * (create, accept, reject, cancel) — a missing header is a 422. Mint one per
 * transition so a client retry replays the recorded result instead of the
 * gateway re-running the command.
 */
function withIdempotency(ctx: GatewayContext): GatewayContext {
  return { ...ctx, headers: { ...ctx.headers, 'Idempotency-Key': mintIdempotencyKey() } };
}

/** Gateway calls must resolve quickly — a fossilised gateway is surfaced as a
 * fast `GatewayError` instead of hanging the BFF until the browser aborts. */
const GATEWAY_TIMEOUT_MS = 10_000;

async function gatewayGet<T>(path: string, organizationId: string, ctx: GatewayContext): Promise<T> {
  let response: Response;
  try {
    response = await forwardToGateway(path, {
      method: 'GET',
      cookie: ctx.cookie,
      headers: gatewayHeaders(organizationId, ctx),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    });
  } catch {
    throw new GatewayError(504, { code: 'server', message: 'The venue service did not respond in time.', status: 504 });
  }
  const bodyText = await response.text();
  if (!response.ok) {
    throw new GatewayError(response.status, safeParse(bodyText));
  }
  if (bodyText.length === 0) return undefined as T;
  return parseJson(bodyText) as T;
}

async function gatewayPost<T>(
  path: string,
  organizationId: string,
  body: Record<string, unknown>,
  ctx: GatewayContext,
): Promise<T> {
  let response: Response;
  try {
    response = await forwardToGateway(path, {
      method: 'POST',
      body,
      cookie: ctx.cookie,
      headers: gatewayHeaders(organizationId, ctx),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    });
  } catch {
    throw new GatewayError(504, { code: 'server', message: 'The venue service did not respond in time.', status: 504 });
  }
  const bodyText = await response.text();
  if (!response.ok) {
    throw new GatewayError(response.status, safeParse(bodyText));
  }
  if (bodyText.length === 0) return undefined as T;
  return parseJson(bodyText) as T;
}

function safeParse(bodyText: string): unknown {
  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    return { code: 'server', message: 'Gateway returned a non-JSON error.', status: 500 };
  }
}

/* ─── Wire → UI mapping ─────────────────────────────────────────────────── */

function mapStatus(status: SlotRequestDto['status']): SlotRequestStatus {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'accepted':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
  }
}

function partnerInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return words.map((word) => word[0]?.toUpperCase() ?? '').join('') || '?';
}

/** Renders an ISO timestamp as a short weekday/date label, UTC — deterministic. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Renders a start/end ISO pair as a human time range, UTC. */
function formatTime(startAt: string, endAt: string | null): string {
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;
  if (Number.isNaN(start.getTime())) return '—';
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  };
  const startLabel = start.toLocaleTimeString('en-IN', options);
  if (!end || Number.isNaN(end.getTime())) return startLabel;
  return `${startLabel} – ${end.toLocaleTimeString('en-IN', options)}`;
}

function toUiEvent(
  event: EventDto | null,
  message: string | undefined,
  venueName: string,
  titleFallback: string,
): SlotRequestEvent {
  if (!event) {
    return {
      name: titleFallback,
      description: 'The linked event is no longer available.',
      date: '—',
      time: '—',
      venue: venueName,
      ...(message ? { note: message } : {}),
    };
  }
  return {
    name: event.title,
    description: (event.summary || event.description || '').trim() || 'No description provided yet.',
    date: formatDate(event.startAt),
    time: formatTime(event.startAt, event.endAt ?? null),
    venue: venueName,
    ...(message ? { note: message } : {}),
    // GAP: ticket tiers / pricing / tables / codes / artists / promoters are
    // catalog reads outside this slice — leave them absent so the UI hides the
    // sections instead of showing invented numbers.
  };
}

function toUiRequest(
  dto: SlotRequestDto,
  direction: SlotRequestDirection,
  event: EventDto | null,
  venueName: string,
  partnerName: string,
  partnerRoleLabel: 'Host' | 'Venue',
  titleFallback: string,
): SlotRequest {
  return {
    id: dto.id,
    status: mapStatus(dto.status),
    direction,
    partnerName,
    partnerRoleLabel,
    partnerInitials: partnerInitials(partnerName),
    event: toUiEvent(event, dto.message, venueName, titleFallback),
  };
}

/* ─── Reads ──────────────────────────────────────────────────────────────── */

/**
 * Incoming list for a venue organization: every slot request that landed on any
 * of the org's venues, each enriched with the host's drafted event + requester
 * name via the venue-owner detail endpoint.
 */
async function loadIncoming(organizationId: string, ctx: GatewayContext): Promise<SlotRequestsData> {
  const entries = await fetchIncomingEntries(organizationId, ctx);
  return {
    dataStatus: 'live',
    accent: 'orange',
    direction: 'incoming',
    requests: entries.map((entry) => entry.request),
  };
}

/**
 * Outgoing list for a host organization: the requests it submitted, enriched
 * with the host's own event and the target venue. Enrichment failures for a
 * deleted target are tolerated so a historical request stays visible.
 */
async function loadOutgoing(organizationId: string, ctx: GatewayContext): Promise<SlotRequestsData> {
  const entries = await fetchOutgoingEntries(organizationId, ctx);
  return {
    dataStatus: 'live',
    accent: 'lavender',
    direction: 'outgoing',
    requests: entries.map((entry) => entry.request),
  };
}

interface SlotRequestEntry {
  readonly createdAt: string;
  readonly request: SlotRequest;
}

/** Runs `work` over `items` with at most `limit` in flight at once. */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  work: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await work(items[index] as T);
    }
  }
  const workers = new Array(Math.min(limit, items.length))
    .fill(null)
    .map(() => worker());
  await Promise.all(workers);
  return results;
}

async function fetchIncomingEntries(
  organizationId: string,
  ctx: GatewayContext,
): Promise<SlotRequestEntry[]> {
  const venues = await gatewayGet<Paginated<VenueDto>>(
    `/api/v2/organizations/${encodeURIComponent(organizationId)}/venues?limit=100`,
    organizationId,
    ctx,
  );

  const pages = await Promise.all(
    venues.items.map((venue) =>
      gatewayGet<Paginated<SlotRequestDto>>(
        `/api/v2/venues/${encodeURIComponent(venue.id)}/slot-requests?limit=100`,
        organizationId,
        ctx,
      ),
    ),
  );

  const byVenueId = new Map(venues.items.map((venue) => [venue.id, venue]));
  const requests: { venueId: string; dto: SlotRequestDto }[] = [];
  for (const [venueIndex, page] of pages.entries()) {
    const venue = byVenueId.get(venues.items[venueIndex]?.id ?? '');
    if (venue === undefined) continue;
    for (const dto of page.items) {
      requests.push({ venueId: venue.id, dto });
    }
  }

  // Enrich with the venue-owner detail (event + requester name), parallel across
  // requests rather than one gateway round-trip per request in a serial loop.
  const details = await mapWithConcurrency(requests, 8, ({ venueId, dto }) =>
    gatewayGet<SlotRequestDetailDto>(
      `/api/v2/venues/${encodeURIComponent(venueId)}/slot-requests/${encodeURIComponent(dto.id)}`,
      organizationId,
      ctx,
    ).catch(ignoreMissing),
  );

  const entries = requests.map(({ venueId, dto }, index) => {
    const detail = details[index] ?? null;
    const venueName = byVenueId.get(venueId)?.name ?? venueId;
    return {
      createdAt: dto.createdAt,
      request: toUiRequest(
        dto,
        'incoming',
        detail?.event ?? null,
        venueName,
        detail?.host?.name ?? dto.hostId,
        'Host',
        detail?.event?.title ?? 'Slot request',
      ),
    };
  });

  entries.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return entries;
}

async function fetchOutgoingEntries(
  organizationId: string,
  ctx: GatewayContext,
): Promise<SlotRequestEntry[]> {
  const page = await gatewayGet<Paginated<SlotRequestDto>>(
    `/api/v2/organizations/${encodeURIComponent(organizationId)}/slot-requests?limit=100`,
    organizationId,
    ctx,
  );

  // Two bulk reads cover all enrichment: the org's venues (name lookup) and the
  // org's own events (title/art lookup) — no per-request gateway round-trips.
  // Both are best-effort: a failed bulk read degrades enrichment (fallback
  // names/titles) instead of failing the whole list, matching the old
  // per-request `ignoreMissing` tolerance.
  const [venuesById, eventsById] = await Promise.all([
    gatewayGet<Paginated<VenueDto>>(
      `/api/v2/organizations/${encodeURIComponent(organizationId)}/venues?limit=100`,
      organizationId,
      ctx,
    )
      .then((data) => new Map(data.items.map((venue) => [venue.id, venue])))
      .catch(() => new Map<string, VenueDto>()),
    gatewayGet<Paginated<EventDto>>(
      `/api/v2/organizations/${encodeURIComponent(organizationId)}/events?limit=100`,
      organizationId,
      ctx,
    )
      .then((data) => new Map(data.items.map((event) => [event.id, event])))
      .catch(() => new Map<string, EventDto>()),
  ]);

  const entries = page.items.map((dto) => {
    const event = dto.eventId ? (eventsById.get(dto.eventId) ?? null) : null;
    const venueName = dto.venueId ? (venuesById.get(dto.venueId)?.name ?? dto.venueId) : dto.venueId;
    return {
      createdAt: dto.createdAt,
      request: toUiRequest(
        dto,
        'outgoing',
        event,
        venueName,
        venueName,
        'Venue',
        event?.title ?? 'Slot request',
      ),
    };
  });

  entries.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return entries;
}

function ignoreMissing(error: unknown): null {
  if (error instanceof GatewayError && error.status === 404) return null;
  throw error;
}

export async function loadSlotRequestsData(
  direction: SlotRequestDirection,
  organizationId: string,
  ctx: GatewayContext,
): Promise<SlotRequestsData> {
  return direction === 'incoming'
    ? loadIncoming(organizationId, ctx)
    : loadOutgoing(organizationId, ctx);
}

/* ─── Notifications (derived from slot-request statuses) ─────────────────── */

type PartnerNotificationType = 'payout' | 'request' | 'marketing' | 'operations' | 'system';
type PartnerNotificationIcon = 'finance' | 'partner' | 'marketing' | 'operations' | 'request';

export interface PartnerNotificationDto {
  readonly id: string;
  readonly description: string;
  readonly time: string;
  readonly type: PartnerNotificationType;
  readonly icon: PartnerNotificationIcon;
  readonly href?: string;
  readonly unread: boolean;
}

function relativeTime(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 'now';
  const minutes = Math.max(1, Math.round((Date.now() - created) / 60000));
  if (minutes < 60) return `${String(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${String(hours)}h`;
  return `${String(Math.floor(hours / 24))}d`;
}

function toNotification(entry: SlotRequestEntry): PartnerNotificationDto | null {
  const request = entry.request;
  const isIncoming = request.direction === 'incoming';
  const base = {
    time: relativeTime(entry.createdAt),
    type: 'request' as const,
    icon: 'request' as const,
    unread: true,
  };
  if (request.status === 'pending' && isIncoming) {
    return {
      ...base,
      id: `notif-${request.id}`,
      description: `New slot request from ${request.partnerName}`,
      href: `/partner/venue/slot-requests?request=${encodeURIComponent(request.id)}`,
    };
  }
  if (request.status === 'approved' && !isIncoming) {
    return {
      ...base,
      id: `notif-${request.id}`,
      description: `Slot request accepted by ${request.partnerName}`,
      href: `/partner/host/slot-requests?request=${encodeURIComponent(request.id)}`,
    };
  }
  if (request.status === 'rejected' && !isIncoming) {
    return {
      ...base,
      id: `notif-${request.id}`,
      description: `Slot request declined by ${request.partnerName}`,
      href: `/partner/host/slot-requests?request=${encodeURIComponent(request.id)}`,
    };
  }
  return null;
}

/**
 * Derives the notification strip for a slate from real slot-request statuses —
 * no guessed Phase-8 notification contract: venues see incoming *pending* asks,
 * hosts see *accepted* and *rejected* outcomes on their outgoing requests.
 */
export async function loadSlotRequestNotifications(
  direction: SlotRequestDirection,
  organizationId: string,
  ctx: GatewayContext,
): Promise<PartnerNotificationDto[]> {
  const entries =
    direction === 'incoming'
      ? await fetchIncomingEntries(organizationId, ctx)
      : await fetchOutgoingEntries(organizationId, ctx);
  return entries.map(toNotification).filter((entry): entry is PartnerNotificationDto => entry !== null);
}

/* ─── Mutations ──────────────────────────────────────────────────────────── */

export async function acceptSlotRequest(
  slotRequestId: string,
  organizationId: string,
  ctx: GatewayContext,
): Promise<SlotRequestDto> {
  return gatewayPost<SlotRequestDto>(
    `/api/v2/venues/slot-requests/${encodeURIComponent(slotRequestId)}/accept`,
    organizationId,
    {},
    withIdempotency(ctx),
  );
}

export async function rejectSlotRequest(
  slotRequestId: string,
  organizationId: string,
  ctx: GatewayContext,
): Promise<SlotRequestDto> {
  return gatewayPost<SlotRequestDto>(
    `/api/v2/venues/slot-requests/${encodeURIComponent(slotRequestId)}/reject`,
    organizationId,
    {},
    withIdempotency(ctx),
  );
}

export async function cancelSlotRequest(
  slotRequestId: string,
  organizationId: string,
  ctx: GatewayContext,
): Promise<SlotRequestDto> {
  return gatewayPost<SlotRequestDto>(
    `/api/v2/venues/slot-requests/${encodeURIComponent(slotRequestId)}/cancel`,

    organizationId,
    {},
    withIdempotency(ctx),
  );
}

/* ─── Host "submit for approval" workflow ────────────────────────────────── */

export interface HostSlotRequestSubmitInput {
  readonly organizationId: string;
  readonly venueId: string;
  readonly name: string;
  /** YYYY-MM-DD. */
  readonly date: string;
  /** Twelve or twenty-four hour clock, e.g. "7:30 PM". */
  readonly time: string;
  readonly endTime?: string;
  readonly dateLabel: string;
  readonly genres: readonly string[];
  readonly artists: readonly string[];
  /** Public poster URL resolved on the client (null = gradient artwork). */
  readonly posterPublicUrl?: string | null;
}

export interface HostSlotRequestSubmitResult {
  readonly eventId: string;
  readonly slotRequestId: string;
}

/**
 * Creates the host's draft event, then submits a slot request to the target
 * venue — both against the gateway from the server. Each write mints its own
 * `Idempotency-Key` so a client retry cannot double-create either record.
 */
export async function submitHostSlotRequest(
  input: HostSlotRequestSubmitInput,
  ctx: GatewayContext,
): Promise<HostSlotRequestSubmitResult> {
  const startAt = eventStartAtFromDraft(input);
  if (!startAt) throw new GatewayError(400, { code: 'validation', message: 'Enter a valid event date and start time.', status: 400 });
  const { organizationId } = input;

  const event = await gatewayPost<EventDto>(
    `/api/v2/organizations/${encodeURIComponent(organizationId)}/events`,
    organizationId,
    {
      venueId: input.venueId,
      title: input.name.trim(),
      imageUrl: input.posterPublicUrl ?? null,
      startAt,
      endAt: eventEndAtFromDraft(input),
      tags: [...new Set([...input.genres, ...input.artists])].slice(0, 50),
    },
    { ...ctx, headers: { ...ctx.headers, 'Idempotency-Key': mintIdempotencyKey() } },
  );

  const slotRequest = await gatewayPost<SlotRequestDto>(
    `/api/v2/venues/${encodeURIComponent(input.venueId)}/slot-requests`,
    organizationId,
    {
      eventId: event.id,
      message: `Host request for "${input.name.trim()}" on ${input.dateLabel}`,
    },
    { ...ctx, headers: { ...ctx.headers, 'Idempotency-Key': mintIdempotencyKey() } },
  );

  return { eventId: event.id, slotRequestId: slotRequest.id };
}