import 'server-only';

import { cookies } from 'next/headers';

import { ApiClientError } from '@c1rcle/api-client';

import { createServerApiClient } from '@/lib/api/server-client';
import {
  getFinanceBalance,
  listBankAccounts,
  listFinanceOrders,
  listLedgerEntries,
  listPayouts,
} from '@/lib/finance/api-finance-repository';
import { toPartnerFinanceData } from '@/lib/finance/finance-view-model';
// The PURE cookie module, not `@/lib/org/active-org`. The latter also exports
// `setActiveOrg`, which imports the `@c1rcle/auth` barrel → `session-store` →
// `useSyncExternalStore`; the RSC build rejects a client-only React API in a
// Server Component, and `tsc` / lint / vitest all happily pass it. See
// `active-org-cookie.ts` for the full write-up.
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

import type { FinanceAccent, PartnerFinanceData } from '@/data/partner-data-source';
import type { ServerApiClient } from '@/lib/api/server-client';

/**
 * ─── Server loader for the finance screens ──────────────────────────────────
 *
 * The one place a `PartnerFinanceData` comes from the wire. Everything below the
 * loader is pure (repository → view model → props), so the screen components
 * stay presentational and the only place that knows about cookies, org scoping
 * and HTTP is this file.
 *
 * WHY SERVER-SIDE: the finance desk is a first paint, not an interaction. It
 * also avoids the failure mode that matters most here — a browser fetch that
 * 401s or 500s must not leave a fixture balance on screen next to real bank
 * details. If the API cannot answer, this throws and the route's error boundary
 * says so; it never degrades to placeholder numbers.
 */

/** Rows fetched per collection. Enough to fill a table; paging is a follow-up. */
const PAGE_SIZE = 50;

/** Number of org-scoped reads a single finance render makes. */
const READ_COUNT = 5;

/**
 * Why the finance desk could not be read.
 *
 * The three values are deliberately **not** all "something broke", because the
 * correct screen differs: a signed-out viewer needs to log in, a viewer with no
 * active org needs to pick one, and only a transient failure is worth a retry
 * button. Collapsing them into one generic error would offer "Try again" to
 * someone whose session is gone, which cannot succeed.
 *
 *  - `signed-out` — a session cookie was present but the gateway rejected it.
 *    Cookie-*less* requests never reach here: the proxy redirects those to
 *    `/login` before the route renders. This is the stale-cookie case.
 *  - `no-organization` — authenticated, but no `c1rcle.active-org` hint, so
 *    there is no tenant to read.
 *  - `forbidden` — authenticated, but not a member of the org in the cookie.
 *  - `api` — anything else. Retryable, so it gets a retry affordance.
 */
export type FinanceLoadFailure = 'signed-out' | 'no-organization' | 'forbidden' | 'api';

export class FinanceLoadError extends Error {
  constructor(
    readonly reason: FinanceLoadFailure,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'FinanceLoadError';
  }
}

/**
 * Maps a thrown cause onto a {@link FinanceLoadFailure}.
 *
 * Exported for its own tests: the mapping is the entire value of this
 * classifier, and it is exactly the branch a future reader would be tempted to
 * "simplify" back into a blanket `api`.
 */
export function classifyFinanceFailure(cause: unknown): FinanceLoadFailure {
  if (cause instanceof ApiClientError) {
    if (cause.isAuthFailure) return 'signed-out';
    // 403 is its own state, not a generic failure: the viewer is signed in and
    // simply not in this org, so a retry will never help. Surfacing it as
    // "try again" would send them round a loop with a dead button.
    if (cause.status === 403) return 'forbidden';
  }
  return 'api';
}

export interface FinanceLoaderOptions {
  /** Cosmetic role tint. Not a permission — the gateway enforces access. */
  readonly accent: FinanceAccent;
  /** Injected in tests; defaults to a client built from this request's cookies. */
  readonly client?: ServerApiClient;
  readonly organizationId?: string | null;
}

/**
 * Reads everything the finance screen needs for one organization.
 *
 * The five reads are issued **concurrently**: they are independent, and
 * serialising them would make the page's time-to-first-paint the *sum* of five
 * round-trips instead of the slowest one.
 */
export async function loadFinanceData(options: FinanceLoaderOptions): Promise<PartnerFinanceData> {
  const cookieHeader = (await cookies()).toString();
  const client = options.client ?? createServerApiClient(cookieHeader);
  const organizationId = options.organizationId ?? getActiveOrgIdFromCookieHeader(cookieHeader);

  if (!organizationId) {
    throw new FinanceLoadError(
      'no-organization',
      'No active organization selected — the finance desk has no tenant to read.',
    );
  }

  let balance;
  let ledger;
  let payouts;
  let bankAccounts;
  let orders;
  try {
    [balance, ledger, payouts, bankAccounts, orders] = await Promise.all([
      getFinanceBalance(client, organizationId),
      listLedgerEntries(client, organizationId, { limit: PAGE_SIZE }),
      listPayouts(client, organizationId, { limit: PAGE_SIZE }),
      listBankAccounts(client, organizationId),
      listFinanceOrders(client, organizationId, { limit: PAGE_SIZE }),
    ]);
  } catch (cause) {
    // `Promise.all` rejects on the *first* failure, so which read failed is not
    // known here and the message deliberately does not guess. What does matter
    // is whether the cause is terminal (signed out, not a member) or transient,
    // so the page can offer the right next step instead of a useless retry.
    throw new FinanceLoadError(
      classifyFinanceFailure(cause),
      `Could not load finance data for organization ${organizationId} (${String(READ_COUNT)} reads issued)`,
      { cause },
    );
  }

  return toPartnerFinanceData({
    accent: options.accent,
    balances: balance,
    ledger: ledger.items,
    payouts: payouts.items,
    bankAccounts,
    orders: orders.items,
  });
}
