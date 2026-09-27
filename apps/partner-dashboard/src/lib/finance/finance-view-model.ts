import type {
  FinanceAccent,
  FinanceBankAccount,
  FinanceMetric,
  FinanceOrder,
  FinanceOrderStatus,
  FinancePayout,
  FinancePayoutStatus,
  FinanceTone,
  PartnerFinanceData,
} from '@/data/partner-data-source';
import type {
  BalanceSummaryResponse,
  BankAccountResponse,
  FinanceOrderDto,
  LedgerEntryDto,
  PayoutResponse,
} from '@c1rcle/contracts';


/**
 * ─── Finance view model ─────────────────────────────────────────────────────
 *
 * The one place where Phase 6 wire shapes become the strings the finance screen
 * renders. Two rules this module exists to enforce:
 *
 * 1. **Paise become rupees in exactly one place.** `formatPaise` is the only
 *    money formatter in the finance path, so no component can quietly re-round a
 *    balance, and every number on the screen went through the same rounding.
 *
 * 2. **Nothing is invented.** Where the backend has no figure, this returns an
 *    honest empty/hedged value instead of a plausible one — see
 *    `formatBalanceDelta` (no previous-period figure exists, so a bare
 *    percentage would be fiction) and the absent `paymentCard` (no card is
 *    stored anywhere). A finance screen that guesses is worse than one that
 *    admits it doesn't know.
 */

/** How many trailing weeks the balance sparkline covers. */
const TREND_WEEKS = 8;

const RUPEE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const RUPEE_PAISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Paise → a rupee string.
 *
 * Paise that don't divide evenly into a rupee keep their paise, because a
 * balance of ₹1,250.50 shown as "₹1,250" is a different number than the ledger
 * holds. Whole-rupee values still render without decimals so the common case
 * doesn't read as noisy.
 */
export function formatPaise(paise: number): string {
  if (!Number.isFinite(paise)) return '—';
  return paise % 100 === 0 ? RUPEE.format(paise / 100) : RUPEE_PAISE.format(paise / 100);
}

/** Compact form for a table cell, e.g. ₹1.25L / ₹4.86Cr. Indian numbering. */
export function formatPaiseCompact(paise: number): string {
  if (!Number.isFinite(paise)) return '—';
  const rupees = paise / 100;
  const sign = rupees < 0 ? '-' : '';
  const absolute = Math.abs(rupees);
  if (absolute >= 10_000_000) return `${sign}₹${(absolute / 10_000_000).toFixed(2)}Cr`;
  if (absolute >= 100_000) return `${sign}₹${(absolute / 100_000).toFixed(2)}L`;
  if (absolute >= 1_000) return `${sign}₹${(absolute / 1_000).toFixed(1)}K`;
  return formatPaise(paise);
}

/** `2026-09-01T10:00:00.000Z` → `1 Sep 2026`. Locale-stable, server-safe. */
export function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  // The month table is exhaustive for a valid `Date`, so the index is always in
  // range — the fallback exists only so the function's return type is a plain
  // `string` rather than `string | undefined` leaking into a rendered cell.
  const month = months[parsed.getUTCMonth()] ?? '';
  return `${String(parsed.getUTCDate())} ${month} ${String(parsed.getUTCFullYear())}`;
}

/** Up to two letters, for the order-row avatar. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0] ?? '';
  if (words.length <= 1) return (first.slice(0, 2) || '?').toUpperCase();
  // `words` is non-empty here, so the last element is always present; the
  // fallback keeps the return type a plain `string`.
  const lastInitial = (words.at(-1) ?? first).charAt(0);
  return `${first.charAt(0)}${lastInitial}`.toUpperCase();
}

/**
 * Deterministic avatar colour from the id, so a row keeps the same swatch
 * across renders instead of reshuffling on every sort. Six tones, indexed by a
 * cheap string hash.
 */
const AVATAR_TONES = [
  'orange',
  'violet',
  'teal',
  'pink',
  'gold',
  'indigo',
] as const satisfies readonly FinanceOrder['avatarTone'][];

export function avatarToneFor(seed: string): FinanceOrder['avatarTone'] {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length] ?? 'orange';
}

/* ─── Status mapping ───────────────────────────────────────────────────────── */

/**
 * The wire enum is richer than the four badges the table draws, so several
 * states share a badge. That collapse is deliberate and lossy-in-one-direction
 * only: every wire status maps to a real badge, and no badge is invented for a
 * status that doesn't exist.
 *
 * The inverse does NOT exist on purpose. A partner clicking "Refunded" must not
 * get told an order is fully refunded when it is only mid-refund, so
 * `refund_requested` gets its own `Pending` badge rather than joining
 * `refunded`.
 */
const ORDER_STATUS_TO_BADGE: Record<FinanceOrderDto['status'], FinanceOrderStatus> = {
  pending: 'Pending',
  awaiting_payment: 'Pending',
  paid: 'Confirmed',
  refund_requested: 'Pending',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
  expired: 'Cancelled',
  failed: 'Cancelled',
};

const PAYOUT_STATUS_TO_BADGE: Record<PayoutResponse['status'], FinancePayoutStatus> = {
  requested: 'Scheduled',
  processing: 'Scheduled',
  paid: 'Paid',
  failed: 'Paid',
  frozen: 'Scheduled',
};

const PAYOUT_STATUS_TO_TONE: Record<PayoutResponse['status'], FinanceTone> = {
  requested: 'neutral',
  processing: 'neutral',
  paid: 'positive',
  failed: 'negative',
  frozen: 'warning',
};

/* ─── Row mappers ──────────────────────────────────────────────────────────── */

export function toFinanceOrder(dto: FinanceOrderDto): FinanceOrder {
  return {
    id: dto.id,
    name: dto.buyerName,
    initials: initialsOf(dto.buyerName),
    // The wire id is the order reference. Showing a fragment keeps the cell
    // readable without inventing a separate "order number" the backend doesn't
    // have; the full id is in the row key and the row action's aria-label.
    orderNumber: dto.id,
    // Prefer `paidAt`: a partner's finance view is about money that actually
    // moved, so an order's payment date is the meaningful one. `createdAt` is
    // the fallback for orders that never got that far.
    date: formatDate(dto.paidAt ?? dto.createdAt),
    event: dto.eventName,
    tickets: dto.ticketCount,
    // Net of refunds: a ₹1,000 order that was refunded shows as ₹0, because
    // that is the money the partner actually kept.
    amount: formatPaise(dto.grandTotalPaise - dto.refundedPaise),
    status: ORDER_STATUS_TO_BADGE[dto.status],
    avatarTone: avatarToneFor(dto.id),
  };
}

export function toFinancePayout(payout: PayoutResponse): FinancePayout {
  return {
    id: payout.id,
    date: formatDate(payout.processedAt ?? payout.createdAt),
    detail:
      payout.status === 'failed' && payout.failureReason
        ? `Failed · ${payout.failureReason}`
        : payout.status === 'frozen'
          ? 'Frozen pending review'
          : payout.status === 'processing'
            ? 'Processing at the bank'
            : payout.status === 'paid'
              ? 'Paid to your bank account'
              : 'Scheduled',
    status: PAYOUT_STATUS_TO_BADGE[payout.status],
    amount: formatPaise(payout.amountPaise),
  };
}

/**
 * The bank account row. `maskedAccountNumber` is the only account number that
 * exists on this side of the wire, so `displayNumber` is set from it verbatim —
 * never reformatted into something that looks more revealing.
 */
export function toFinanceBankAccount(account: BankAccountResponse | null): FinanceBankAccount {
  if (!account) {
    return {
      bankName: 'No payout account',
      displayNumber: 'Not set',
      ifscCode: '—',
      accountHolder: '—',
      verified: false,
    };
  }
  return {
    bankName: account.bankName,
    displayNumber: account.maskedAccountNumber,
    ifscCode: account.ifscCode,
    accountHolder: account.accountHolder,
    verified: account.verified,
  };
}

/* ─── Derived figures ──────────────────────────────────────────────────────── */

/** Ledger entry types that represent money arriving for the organization. */
const INFLOW_TYPES: ReadonlySet<LedgerEntryDto['entryType']> = new Set([
  'host_payout',
  'venue_share',
  'promoter_commission',
]);

/**
 * Weekly settled inflow over the trailing `TREND_WEEKS` weeks, oldest first.
 *
 * Derived from the ledger page the caller already fetched — no second request,
 * no client-side guessing. Buckets with no entries are `0` rather than omitted,
 * so the sparkline's x-axis is evenly spaced and a quiet week reads as flat
 * instead of compressing the weeks that had activity.
 */
export function toBalanceTrend(
  entries: readonly LedgerEntryDto[],
  now: Date = new Date(),
): readonly number[] {
  const thisWeekStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const buckets = new Array<number>(TREND_WEEKS).fill(0);

  for (const entry of entries) {
    if (!INFLOW_TYPES.has(entry.entryType)) continue;
    if (entry.status === 'pending') continue; // not money yet
    const at = Date.parse(entry.createdAt);
    if (Number.isNaN(at)) continue;
    const daysAgo = Math.floor((thisWeekStart - at) / (24 * 60 * 60 * 1000));
    const weekIndex = Math.floor(daysAgo / 7);
    if (weekIndex < 0 || weekIndex >= TREND_WEEKS) continue;
    const slot = TREND_WEEKS - 1 - weekIndex;
    buckets[slot] = (buckets[slot] ?? 0) + entry.amountPaise;
  }

  return buckets;
}

/**
 * Period-over-period change on settled inflow: this week vs the week before.
 *
 * Returns an honest sentence rather than a bare percentage, and says so when
 * there is no baseline. The backend keeps no period snapshots, so this is
 * computed from the ledger page rather than read from a field — which also
 * means it is only as good as the page it was given.
 */
export function formatBalanceDelta(entries: readonly LedgerEntryDto[]): string {
  const settled = entries.filter(
    (entry) => INFLOW_TYPES.has(entry.entryType) && entry.status !== 'pending',
  );
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayMs = 24 * 60 * 60 * 1000;

  let thisWeek = 0;
  let lastWeek = 0;
  for (const entry of settled) {
    const at = Date.parse(entry.createdAt);
    if (Number.isNaN(at)) continue;
    const daysAgo = Math.floor((today - at) / dayMs);
    if (daysAgo < 0 || daysAgo >= 14) continue;
    if (daysAgo < 7) thisWeek += entry.amountPaise;
    else lastWeek += entry.amountPaise;
  }

  if (thisWeek === 0 && lastWeek === 0) return 'No settled income yet';
  if (lastWeek === 0) return 'New income this week';
  const percent = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  if (percent === 0) return 'Unchanged week on week';
  return `${percent > 0 ? '+' : ''}${String(percent)}% week on week`;
}

/**
 * The "next payout" tile.
 *
 * Prefers a payout that is actually in flight; falls back to the most recent
 * settled one so the tile is never blank on a partner who has been paid
 * before; and only says "none scheduled" when there is genuinely nothing.
 */
export function toNextPayoutMetric(payouts: readonly PayoutResponse[]): FinanceMetric {
  const inFlight = payouts.find(
    (payout) => payout.status === 'requested' || payout.status === 'processing',
  );
  const chosen = inFlight ?? payouts[0];

  if (!chosen) {
    return {
      label: 'Next payout',
      value: 'None scheduled',
      detail: 'Request one from your available balance',
      tone: 'neutral',
    };
  }

  return {
    label: inFlight ? 'Next payout' : 'Last payout',
    value: formatPaise(chosen.amountPaise),
    detail:
      chosen.status === 'failed'
        ? 'Last attempt failed — check your bank account'
        : `${PAYOUT_STATUS_TO_BADGE[chosen.status]} · ${formatDate(chosen.processedAt ?? chosen.createdAt)}`,
    tone: PAYOUT_STATUS_TO_TONE[chosen.status],
  };
}

/* ─── Assembly ─────────────────────────────────────────────────────────────── */

export interface FinanceScreenInput {
  readonly accent: FinanceAccent;
  readonly balances: BalanceSummaryResponse;
  readonly ledger: readonly LedgerEntryDto[];
  readonly payouts: readonly PayoutResponse[];
  readonly bankAccounts: readonly BankAccountResponse[];
  readonly orders: readonly FinanceOrderDto[];
  /**
   * The default bank account wins. `listBankAccounts` is unordered, so
   * "pick the default, else the first" is the only selection rule that is
   * stable rather than arbitrary.
   */
  readonly defaultBankAccountId?: string | null;
}

/**
 * Builds the whole `PartnerFinanceData` for a finance screen from the five
 * reads that back it. Exported (and pure) so it can be unit-tested against
 * hand-built DTOs without a server or a network.
 *
 * `dataStatus` is hardcoded to `'api'`: reaching this function means the values
 * came off the wire. There is no path here that can substitute a fixture.
 */
export function toPartnerFinanceData(input: FinanceScreenInput): PartnerFinanceData {
  const { balances, ledger, payouts, bankAccounts, orders } = input;
  const defaultAccount =
    bankAccounts.find((account) => account.id === input.defaultBankAccountId) ??
    bankAccounts.find((account) => account.isDefault) ??
    bankAccounts[0] ??
    null;

  const pendingBalance: FinanceMetric = {
    label: 'Pending settlement',
    value: formatPaise(balances.pendingPaise),
    detail: 'Clears once the sale settles',
    tone: balances.pendingPaise > 0 ? 'warning' : 'neutral',
  };

  return {
    dataStatus: 'api',
    accent: input.accent,
    availableBalance: formatPaise(balances.availablePaise),
    balanceDelta: formatBalanceDelta(ledger),
    balanceDetail: `${formatPaise(balances.lifetimePaise)} earned all time`,
    balanceTrend: toBalanceTrend(ledger),
    pendingBalance,
    nextPayout: toNextPayoutMetric(payouts),
    bankAccount: toFinanceBankAccount(defaultAccount),
    // Intentionally absent: there is no card on file, and no card number or
    // CVC may be invented to fill this slot. `FinanceBankCards` renders the
    // empty state instead.
    payouts: payouts.map(toFinancePayout),
    orders: orders.map(toFinanceOrder),
  };
}
