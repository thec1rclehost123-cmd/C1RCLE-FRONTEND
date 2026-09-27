import {
  balanceSummaryResponseSchema,
  bankAccountListResponseSchema,
  financeOrderListResponseSchema,
  ledgerEntryListResponseSchema,
  payoutListResponseSchema,
  payoutResponseSchema,
} from '@c1rcle/contracts';

import type {
  BalanceSummaryResponse,
  BankAccountResponse,
  FinanceOrderDto,
  LedgerEntryDto,
  PayoutResponse,
} from '@c1rcle/contracts';
import type { z } from 'zod';

/**
 * The slice of the API client these calls need. Declared structurally rather
 * than imported as a concrete type so the same repository serves a Server
 * Component (per-request cookie client) and a Client Component (browser token
 * client) without either one importing the other's auth state.
 */
export interface FinanceApiClient {
  get<T>(options: { path: string; schema: z.ZodType<T>; headers?: Record<string, string> }): Promise<T>;
  post<T>(options: {
    path: string;
    schema: z.ZodType<T>;
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<T>;
}

/**
 * ─── Finance (Phase 6) ─────────────────────────────────────────────────────
 *
 * Balance, ledger, orders, payouts and bank accounts for one organization.
 * Every route is `:organizationId`-scoped and `requirePermission('organization.read')`
 * server-side, so no `X-Organization-Id` header is needed here — the path
 * segment is authoritative and `requireOrgAccess` scopes the read. (Contrast
 * `venue-repository.ts`, whose venue routes *do* demand the header; that is a
 * per-route decision, not a blanket rule.)
 *
 * The client is a **required first argument** on every function, never a module
 * import. That is the load-bearing choice in this file: the finance screens are
 * Server Components, and a repository that reached for the browser singleton
 * would either fail at import (`server-only`) or, worse, ship one browser's
 * token into a server render.
 *
 * Money is integer paise everywhere on this boundary. Formatting to a display
 * string is a UI concern and deliberately happens in the caller — see
 * `finance-view-model.ts`, the single place paise become rupees.
 *
 * NOTE — the "no fallback to a fixture after an API error" rule is why these
 * functions let errors propagate. An empty balance is a real state; a
 * fixture balance next to a real bank account is a lie.
 */

function orgPath(organizationId: string, suffix: string): string {
  return `/api/v2/organizations/${encodeURIComponent(organizationId)}/finance${suffix}`;
}

function orgCollectionPath(organizationId: string, collection: string, suffix = ''): string {
  return `/api/v2/organizations/${encodeURIComponent(organizationId)}/${collection}${suffix}`;
}

/** Available / pending / lifetime, all integer paise. */
export async function getFinanceBalance(
  client: FinanceApiClient,
  organizationId: string,
): Promise<BalanceSummaryResponse> {
  return client.get({
    path: orgPath(organizationId, '/balance'),
    schema: balanceSummaryResponseSchema,
  });
}

/**
 * The wire cursor is opaque and `pageInfo` does NOT echo it back — the only
 * signal that another page exists is `hasNextPage`. So a caller that wants to
 * page further must remember the cursor it *sent* and re-send it; the response
 * cannot hand it a fresh one. `hasNextPage` is therefore surfaced as-is rather
 * than dressed up as a `nextPage` token that isn't there.
 */
export interface LedgerPage {
  readonly items: readonly LedgerEntryDto[];
  readonly total: number;
  /** True when another page exists; the cursor to re-send is the one you passed in. */
  readonly hasNextPage: boolean;
}

function pageQuery(query: { readonly cursor?: string | null; readonly limit?: number }): string {
  const search = new URLSearchParams();
  if (query.limit !== undefined) search.set('limit', String(query.limit));
  if (query.cursor != null) search.set('cursor', query.cursor);
  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

/** One page of ledger entries. Pass the cursor you last sent, or nothing. */
export async function listLedgerEntries(
  client: FinanceApiClient,
  organizationId: string,
  query: { readonly cursor?: string | null; readonly limit?: number } = {},
): Promise<LedgerPage> {
  const response = await client.get({
    path: orgPath(organizationId, `/ledger${pageQuery(query)}`),
    schema: ledgerEntryListResponseSchema,
  });
  return {
    items: response.items,
    total: response.pageInfo.total,
    hasNextPage: response.pageInfo.hasNextPage,
  };
}

export interface PayoutPage {
  readonly items: readonly PayoutResponse[];
  readonly total: number;
  readonly hasNextPage: boolean;
}

/**
 * The partner's own orders — the revenue behind the balance, newest first.
 *
 * NOT `GET /orders`: that one lists the *caller's purchases* and is scoped to
 * the buyer, so it can never answer "my event's sales". The org-scoped twin
 * lives under `/finance/` and returns a deliberately narrow DTO — no pricing
 * breakdown, no payment intent id, and the buyer by name only.
 */
export interface FinanceOrderPage {
  readonly items: readonly FinanceOrderDto[];
  readonly total: number;
  readonly hasNextPage: boolean;
}

export async function listFinanceOrders(
  client: FinanceApiClient,
  organizationId: string,
  query: { readonly cursor?: string | null; readonly limit?: number } = {},
): Promise<FinanceOrderPage> {
  const response = await client.get({
    path: orgPath(organizationId, `/orders${pageQuery(query)}`),
    schema: financeOrderListResponseSchema,
  });
  return {
    items: response.items,
    total: response.pageInfo.total,
    hasNextPage: response.pageInfo.hasNextPage,
  };
}

export async function listPayouts(
  client: FinanceApiClient,
  organizationId: string,
  query: { readonly cursor?: string | null; readonly limit?: number } = {},
): Promise<PayoutPage> {
  const response = await client.get({
    path: orgCollectionPath(organizationId, 'payouts', pageQuery(query)),
    schema: payoutListResponseSchema,
  });
  return {
    items: response.items,
    total: response.pageInfo.total,
    hasNextPage: response.pageInfo.hasNextPage,
  };
}

export async function getPayout(
  client: FinanceApiClient,
  organizationId: string,
  payoutId: string,
): Promise<PayoutResponse> {
  return client.get({
    path: orgCollectionPath(organizationId, 'payouts', `/${encodeURIComponent(payoutId)}`),
    schema: payoutResponseSchema,
  });
}

/**
 * Bank accounts come back **masked only** — `bankAccountResponseSchema` has no
 * plaintext or encrypted account-number field at all, by design. The UI can
 * therefore show a last-4 style mask and nothing more, and must not offer to
 * "reveal" a number it never receives.
 *
 * Unlike the paged routes, this one is `{items}` with no `pageInfo`.
 */
export async function listBankAccounts(
  client: FinanceApiClient,
  organizationId: string,
): Promise<readonly BankAccountResponse[]> {
  const response = await client.get({
    path: orgCollectionPath(organizationId, 'bank-accounts'),
    schema: bankAccountListResponseSchema,
  });
  return response.items;
}

/**
 * Requests a payout. `idempotencyKey` is one per user *intent* — a retry of
 * the same withdrawal must replay it rather than move money twice, so callers
 * should hold the key across retries and mint a new one for a deliberate
 * second withdrawal.
 */
export async function requestPayout(
  client: FinanceApiClient,
  organizationId: string,
  input: { readonly amountPaise: number; readonly bankAccountId?: string },
  idempotencyKey: string,
): Promise<PayoutResponse> {
  return client.post({
    path: orgCollectionPath(organizationId, 'payouts'),
    body: {
      amountPaise: input.amountPaise,
      ...(input.bankAccountId ? { bankAccountId: input.bankAccountId } : {}),
      idempotencyKey,
    },
    schema: payoutResponseSchema,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

/**
 * Re-exported so a caller that already imports this module does not also need
 * `@c1rcle/contracts` just to type a paginated fixture-free response.
 */
export type {
  LedgerEntryDto,
  PayoutResponse,
  BankAccountResponse,
  BalanceSummaryResponse,
  FinanceOrderDto,
};
