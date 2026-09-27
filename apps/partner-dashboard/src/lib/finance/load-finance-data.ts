import 'server-only';

import { cookies } from 'next/headers';

import { createServerApiClient } from '@/lib/api/server-client';
import {
  getFinanceBalance,
  listBankAccounts,
  listFinanceOrders,
  listLedgerEntries,
  listPayouts,
} from '@/lib/finance/api-finance-repository';
import { toPartnerFinanceData } from '@/lib/finance/finance-view-model';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org';

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

export class FinanceLoadError extends Error {
  constructor(
    readonly reason: 'signed-out' | 'no-organization' | 'api',
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'FinanceLoadError';
  }
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
export async function loadFinanceData(
  options: FinanceLoaderOptions,
): Promise<PartnerFinanceData> {
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
    throw new FinanceLoadError(
      'api',
      `Could not load finance data for organization ${organizationId} (${String(READ_COUNT)} reads failed)`,
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
