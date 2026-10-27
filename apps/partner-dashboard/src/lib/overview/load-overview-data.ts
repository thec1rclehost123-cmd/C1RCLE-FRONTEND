import 'server-only';

import { cookies } from 'next/headers';

import { ApiClientError, paginatedSchema } from '@c1rcle/api-client';
import { partnershipDtoSchema, promoterConnectionDtoSchema } from '@c1rcle/contracts';

import { createServerApiClient } from '@/lib/api/server-client';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';
import {
  getOrganizationCalendar,
  getOrganizationEventCards,
  getOrganizationOverview,
  getOrganizationRecentOrders,
  getOrganizationTrends,
} from '@/lib/overview/api-overview-repository';
import { dayKeyOffset, toOverviewData } from '@/lib/overview/overview-view-model';
// The PURE cookie module, not `@/lib/org/active-org`. The latter also exports
// `setActiveOrg`, which imports the `@c1rcle/auth` barrel → `session-store` →
// `useSyncExternalStore`; the RSC build rejects a client-only React API in a
// Server Component, and `tsc` / lint / vitest all happily pass it. See
// `active-org-cookie.ts` for the full write-up.

import type { OverviewData } from '@/data/partner-data-source';
import type { ServerApiClient } from '@/lib/api/server-client';
import type {
  ActivitySource,
  NetworkPartner,
  OverviewViewModelInput,
} from '@/lib/overview/overview-view-model';

/**
 * ─── Server loader for the overview screen ───────────────────────────────────
 *
 * The one place a real `OverviewData` comes from. Everything below the loader
 * is pure (repository → view model → props), so the screen stays presentational
 * and this file is the only place that knows about cookies, org scoping and
 * HTTP.
 *
 * WHY SERVER-SIDE: the overview is a first paint, not an interaction. It also
 * avoids the failure that matters most here — a browser fetch that 401s or 500s
 * must not leave a fixture revenue chart on screen next to a real event list. If
 * the API cannot answer, this throws and the route's error boundary says so. It
 * never degrades to placeholder numbers.
 */

/** Cards fetched. The screen shows 1 hero + 3 upcoming; a little spare is cheap. */
const CARD_LIMIT = 4;

/**
 * Org-scoped reads per overview render.
 *
 * The three trend reads are the bulk of this, and they are deliberately
 * *separate* requests rather than one wide one. Each range needs a different
 * bucket width — today wants hours, the month wants days, the year wants months
 * — and asking for one granularity and re-bucketing client-side would either
 * give `1D` a single bar or give `All` 400 points to draw 12 lines from.
 */
const READ_COUNT = 8;

/**
 * Why the overview could not be read.
 *
 * The four values are deliberately **not** all "something broke", because the
 * correct screen differs: a signed-out viewer needs to log in, a viewer with no
 * active org needs to pick one, and only a transient failure is worth a retry
 * button. Same taxonomy as `FinanceLoadFailure`, kept separate so one surface's
 * error copy can change without silently changing the other's.
 */
export type OverviewLoadFailure = 'signed-out' | 'no-organization' | 'forbidden' | 'api';

export class OverviewLoadError extends Error {
  constructor(
    readonly reason: OverviewLoadFailure,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'OverviewLoadError';
  }
}

/**
 * Maps a thrown cause onto an {@link OverviewLoadFailure}. Exported for its own
 * tests: this mapping is the entire value of the classifier, and it is exactly
 * the branch a future reader would be tempted to collapse into a blanket `api`.
 */
export function classifyOverviewFailure(cause: unknown): OverviewLoadFailure {
  if (cause instanceof ApiClientError) {
    if (cause.isAuthFailure) return 'signed-out';
    // 403 is its own state: the viewer is signed in and simply not in this org,
    // so a retry can never help. Surfacing it as "try again" would send them
    // round a loop with a dead button.
    if (cause.status === 403) return 'forbidden';
  }
  return 'api';
}

export interface OverviewLoaderOptions {
  /** Cosmetic role tint. Not a permission — the gateway enforces access. */
  readonly accent: 'orange' | 'lavender';
  /** Injected in tests; defaults to a client built from this request's cookies. */
  readonly client?: ServerApiClient;
  readonly organizationId?: string | null;
  readonly displayName?: string | null;
  /** Injected so date labels are deterministic under test. */
  readonly now?: Date;
  readonly network?: readonly NetworkPartner[];
  readonly activity?: readonly ActivitySource[];
}

export async function loadOverviewData(options: OverviewLoaderOptions): Promise<OverviewData> {
  const cookieHeader = (await cookies()).toString();
  const client = options.client ?? createServerApiClient(cookieHeader);
  const organizationId = options.organizationId ?? getActiveOrgIdFromCookieHeader(cookieHeader);

  if (!organizationId) {
    throw new OverviewLoadError(
      'no-organization',
      'No active organization selected — the overview has no tenant to read.',
    );
  }

  // Fixed once, up front, so every window below is derived from the same instant
  // and the four reads cannot straddle midnight and disagree about "today".
  const now = options.now ?? new Date();
  const today = now.toISOString().slice(0, 10);

  let input: OverviewViewModelInput;
  try {
    const [overview, hourly, daily, monthly, calendar, cards, network, recentOrders] =
      await Promise.all([
        getOrganizationOverview(client, organizationId),
        // Today, by the hour. A same-day hourly range is 24 buckets — the
        // endpoint extends the `to` bound to the whole day.
        getOrganizationTrends(client, organizationId, {
          from: today,
          to: today,
          granularity: 'hour',
        }),
        // 30 days covers both the 1W window and the 1M window, so one read
        // serves two ranges. The 1W series slices the trailing 7 buckets.
        getOrganizationTrends(client, organizationId, {
          from: dayKeyOffset(now, 29),
          to: today,
          granularity: 'day',
        }),
        getOrganizationTrends(client, organizationId, {
          // The API accepts day bounds even when bucketing by month.
          from: dayKeyOffset(now, 730),
          to: today,
          granularity: 'month',
        }),
        getOrganizationCalendar(client, organizationId, today.slice(0, 7)),
        getOrganizationEventCards(client, organizationId, CARD_LIMIT),
        options.network
          ? Promise.resolve(options.network)
          : loadOrganizationNetwork(client, organizationId),
        loadRecentOrders(client, organizationId),
      ]);

    input = {
      accent: options.accent,
      overview,
      hourly,
      daily,
      monthly,
      calendar,
      cards,
      displayName: options.displayName ?? null,
      network,
      activity: options.activity ?? [],
      recentOrders,
      now,
    };
  } catch (cause) {
    // `Promise.all` rejects on the *first* failure, so which read failed is not
    // known here and the message deliberately does not guess. What does matter
    // is whether the cause is terminal or transient.
    throw new OverviewLoadError(
      classifyOverviewFailure(cause),
      `Could not load overview data for organization ${organizationId} (${String(READ_COUNT)} reads issued)`,
      { cause },
    );
  }

  return toOverviewData(input);
}

async function loadRecentOrders(client: ServerApiClient, organizationId: string) {
  try {
    return await getOrganizationRecentOrders(client, organizationId, 5);
  } catch (cause) {
    // The finance order endpoint is deliberately permission-gated. A role
    // without finance access may still use the rest of Overview; distinguish
    // that from a genuine empty order list and from a transient API failure.
    if (cause instanceof ApiClientError && cause.status === 403) return null;
    throw cause;
  }
}

async function loadOrganizationNetwork(
  client: ServerApiClient,
  organizationId: string,
): Promise<readonly NetworkPartner[]> {
  const headers = { 'x-organization-id': organizationId };
  const [partnerships, connections] = await Promise.all([
    client.get({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/partnerships?limit=100`,
      schema: paginatedSchema(partnershipDtoSchema),
      headers,
    }),
    client.get({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/promoter-connections?limit=100`,
      schema: paginatedSchema(promoterConnectionDtoSchema),
      headers,
    }),
  ]);
  return [
    ...partnerships.items.map((partnership) => ({
      partnershipId: partnership.id,
      counterpartyOrganizationId:
        partnership.hostOrganizationId === organizationId
          ? partnership.venueOrganizationId
          : partnership.hostOrganizationId,
      side:
        partnership.hostOrganizationId === organizationId ? ('venue' as const) : ('host' as const),
      status: partnership.status,
    })),
    ...connections.items.map((connection) => ({
      partnershipId: connection.id,
      counterpartyOrganizationId:
        connection.promoterId === organizationId ? connection.targetId : connection.promoterId,
      side:
        connection.promoterId === organizationId ? connection.targetType : ('promoter' as const),
      status: connection.status,
    })),
  ];
}
