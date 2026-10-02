import {
  organizationCalendarDtoSchema,
  organizationEventCardListResponseSchema,
  organizationOverviewDtoSchema,
  organizationTrendsDtoSchema,
} from '@c1rcle/contracts';

import type {
  OrganizationCalendarDto,
  OrganizationEventCardListResponse,
  OrganizationOverviewDto,
  OrganizationTrendsDto,
  TrendGranularity,
} from '@c1rcle/contracts';
import type { z } from 'zod';

/**
 * The slice of the API client these calls need. Declared structurally rather
 * than imported as a concrete type so the same repository serves a Server
 * Component (per-request cookie client) and a Client Component (browser token
 * client) without either importing the other's auth state.
 *
 * Mirrors `FinanceApiClient` exactly; the two are separate interfaces rather than
 * one shared one because each is documented against the route family it serves,
 * and merging them would couple the finance reads to an analytics change.
 */
export interface OverviewApiClient {
  get<T>(options: {
    path: string;
    schema: z.ZodType<T>;
    headers?: Record<string, string>;
  }): Promise<T>;
}

/**
 * ─── Overview (Phase 1 analytics) ───────────────────────────────────────────
 *
 * The four reads behind `OverviewData`. Every route is `:organizationId`-scoped
 * and `requirePermission('organization.read')` server-side. The gateway still
 * requires the same organization ID in `X-Organization-Id` for tenancy
 * validation, so every read sends both forms.
 *
 * The client is a **required first argument**, never a module import. The
 * overview screens are Server Components, and a repository that reached for the
 * browser singleton would either fail at import (`server-only`) or, worse, ship
 * one browser's token into a server render.
 *
 * Money is integer paise everywhere on this boundary. Formatting happens in
 * `overview-view-model.ts`, the single place paise become rupees — same rule as
 * the finance path, so a number can never be rounded twice.
 *
 * NOTE — no function here falls back to a fixture after an API error. An
 * organization with no sales is a real state that renders as zeroes; a fixture
 * trend chart next to a real bank balance is a lie. Errors propagate to the
 * loader, which classifies them.
 */
function orgPath(organizationId: string, suffix: string): string {
  return `/api/v2/organizations/${encodeURIComponent(organizationId)}/analytics${suffix}`;
}

function orgHeaders(organizationId: string): Record<string, string> {
  return { 'x-organization-id': organizationId };
}

/** Lifetime headline totals: events, revenue, tickets sold, check-ins. */
export async function getOrganizationOverview(
  client: OverviewApiClient,
  organizationId: string,
): Promise<OrganizationOverviewDto> {
  return client.get({
    path: orgPath(organizationId, '/overview'),
    schema: organizationOverviewDtoSchema,
    headers: orgHeaders(organizationId),
  });
}

export interface TrendsQuery {
  /** Inclusive, `YYYY-MM-DD`. Reversed bounds are swapped server-side. */
  readonly from: string;
  /** Inclusive, `YYYY-MM-DD`. */
  readonly to: string;
  /**
   * Defaults to `day` server-side, but is always sent explicitly here: a
   * silent fallback to the wrong bucket width would produce a plausible chart
   * at the wrong zoom, which is worse than a visible error.
   */
  readonly granularity: TrendGranularity;
}

/**
 * One dense, zero-filled series over `[from, to]`.
 *
 * The contract guarantees every bucket in the window is present, so a caller
 * never has to fill gaps or reason about a missing day.
 */
export async function getOrganizationTrends(
  client: OverviewApiClient,
  organizationId: string,
  query: TrendsQuery,
): Promise<OrganizationTrendsDto> {
  const search = new URLSearchParams({
    from: query.from,
    to: query.to,
    granularity: query.granularity,
  });
  return client.get({
    path: `${orgPath(organizationId, '/trends')}?${search.toString()}`,
    schema: organizationTrendsDtoSchema,
    headers: orgHeaders(organizationId),
  });
}

/**
 * The month grid. `firstDayOffset` is computed server-side, so the client
 * cannot disagree with the server about which weekday the month starts on.
 */
export async function getOrganizationCalendar(
  client: OverviewApiClient,
  organizationId: string,
  month: string,
): Promise<OrganizationCalendarDto> {
  return client.get({
    path: `${orgPath(organizationId, '/calendar')}?${searchMonth(month)}`,
    schema: organizationCalendarDtoSchema,
    headers: orgHeaders(organizationId),
  });
}

function searchMonth(month: string): string {
  return new URLSearchParams({ month }).toString();
}

/**
 * Upcoming events with venue name, sell-through and capacity already resolved
 * server-side. `capacity` is `null` when the venue never declared one, which is
 * not the same as `0` — see `formatSoldOf`.
 */
export async function getOrganizationEventCards(
  client: OverviewApiClient,
  organizationId: string,
  limit: number,
): Promise<OrganizationEventCardListResponse> {
  return client.get({
    path: `${orgPath(organizationId, '/events')}?${new URLSearchParams({
      limit: String(limit),
    }).toString()}`,
    schema: organizationEventCardListResponseSchema,
    headers: orgHeaders(organizationId),
  });
}
