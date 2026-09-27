import { describe, expect, it } from 'vitest';

import {
  avatarToneFor,
  formatBalanceDelta,
  formatDate,
  formatPaise,
  formatPaiseCompact,
  initialsOf,
  toBalanceTrend,
  toFinanceBankAccount,
  toFinanceOrder,
  toFinancePayout,
  toNextPayoutMetric,
  toPartnerFinanceData,
} from './finance-view-model';

import type {
  BankAccountResponse,
  BalanceSummaryResponse,
  FinanceOrderDto,
  LedgerEntryDto,
  PayoutResponse,
} from '@c1rcle/contracts';

/* ─── Money formatting ─────────────────────────────────────────────────────── */

describe('formatPaise', () => {
  it('renders whole rupees without noisy decimals', () => {
    // 1,250,000 paise = ₹12,500 exactly
    expect(formatPaise(1_250_000)).toBe('₹12,500');
  });

  it('keeps the paise when dropping them would change the number', () => {
    // 125,050 paise = ₹1,250.50 — rounding this to "₹1,250" is a lie about
    // a balance, so the fraction survives.
    expect(formatPaise(125_050)).toBe('₹1,250.50');
  });

  it('handles zero and negative balances', () => {
    // A negative available balance is a real (if alarming) state — it must not
    // render as ₹0. -500 paise is exactly -₹5, so the whole-rupee rule applies.
    expect(formatPaise(0)).toBe('₹0');
    expect(formatPaise(-500)).toBe('-₹5');
    // -550 paise is not a whole rupee, so the fraction must survive.
    expect(formatPaise(-550)).toBe('-₹5.50');
  });

  it('refuses to format a non-finite number rather than printing NaN', () => {
    expect(formatPaise(Number.NaN)).toBe('—');
    expect(formatPaise(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('formatPaiseCompact', () => {
  it('uses Indian lakh/crore units for table cells', () => {
    // ₹1,25,000. Worth pinning: the lakh threshold is 100,000 *rupees*, not
    // 1,000 — a table of five-figure amounts silently renders as "₹125.0K".
    expect(formatPaiseCompact(1_25_000_00)).toBe('₹1.25L');
    // ₹48,620 sits just under it, so it stays in the K branch.
    expect(formatPaiseCompact(48_62_000)).toBe('₹48.6K');
    // ₹2,50,00,000 = 2.5 crore.
    expect(formatPaiseCompact(2_50_00_000_00)).toBe('₹2.50Cr');
  });

  it('falls back to thousands then to exact rupees', () => {
    expect(formatPaiseCompact(25_000_00)).toBe('₹25.0K');
    expect(formatPaiseCompact(999_00)).toBe('₹999');
  });

  it('keeps the sign on a negative balance', () => {
    expect(formatPaiseCompact(-25_00_000)).toBe('-₹25.0K');
  });
});

/* ─── Small helpers ────────────────────────────────────────────────────────── */

describe('formatDate', () => {
  it('formats an ISO instant in UTC so the server and client agree', () => {
    // A naive local-time format would render 31 Aug here in IST and 1 Sep in
    // UTC, and the two would disagree between the server render and hydration.
    expect(formatDate('2026-09-01T10:00:00.000Z')).toBe('1 Sep 2026');
  });

  it('returns a placeholder for an unparseable instant', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('initialsOf', () => {
  it('takes the first and last word', () => {
    expect(initialsOf('Aarav Mehta')).toBe('AM');
    expect(initialsOf('Rhea Kapoor Events LLP')).toBe('RL');
  });

  it('falls back to the opening two letters of a single name', () => {
    expect(initialsOf('cher')).toBe('CH');
  });

  it('handles empty and whitespace-only names without producing "undefined"', () => {
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('avatarToneFor', () => {
  it('is deterministic, so a row keeps its swatch across sorts', () => {
    expect(avatarToneFor('ord_abc')).toBe(avatarToneFor('ord_abc'));
  });

  it('only ever returns a tone the stylesheet defines', () => {
    const allowed = new Set(['orange', 'violet', 'teal', 'pink', 'gold', 'indigo']);
    for (let index = 0; index < 200; index += 1) {
      expect(allowed.has(avatarToneFor(`ord_${String(index)}`))).toBe(true);
    }
  });
});

/* ─── Row mapping ──────────────────────────────────────────────────────────── */

const order: FinanceOrderDto = {
  id: 'ord_1',
  eventId: 'evt_1',
  eventName: 'Neon Rooftop',
  buyerName: 'Aarav Mehta',
  ticketCount: 3,
  currency: 'INR',
  grandTotalPaise: 250_000,
  refundedPaise: 0,
  status: 'paid',
  paidAt: '2026-09-01T10:05:00.000Z',
  createdAt: '2026-09-01T10:00:00.000Z',
};

describe('toFinanceOrder', () => {
  it('shows the net amount, so a refunded order reads as what was kept', () => {
    const row = toFinanceOrder({ ...order, grandTotalPaise: 250_000, refundedPaise: 100_000 });
    expect(row.amount).toBe('₹1,500');
  });

  it('prefers the payment date, falling back to creation for unpaid orders', () => {
    expect(toFinanceOrder(order).date).toBe('1 Sep 2026');
    const unpaid = toFinanceOrder({
      ...order,
      status: 'pending',
      paidAt: null,
      createdAt: '2026-08-20T08:00:00.000Z',
    });
    expect(unpaid.date).toBe('20 Aug 2026');
  });

  it('does NOT badge a mid-refund order as fully refunded', () => {
    // The dangerous collapse: showing "Refunded" while ₹X is still refundable
    // would tell a partner money is gone that they can still claw back.
    expect(toFinanceOrder({ ...order, status: 'refund_requested' }).status).toBe('Pending');
    expect(toFinanceOrder({ ...order, status: 'refunded' }).status).toBe('Refunded');
  });

  it('collapses the unpaid states onto a Pending badge', () => {
    expect(toFinanceOrder({ ...order, status: 'pending' }).status).toBe('Pending');
    expect(toFinanceOrder({ ...order, status: 'awaiting_payment' }).status).toBe('Pending');
  });

  it('treats a dead order as Cancelled so the badge is one the table styles', () => {
    // `expired`/`failed` have no badge of their own; the table only styles four
    // states, and every wire status must land on one of them.
    expect(toFinanceOrder({ ...order, status: 'expired' }).status).toBe('Cancelled');
    expect(toFinanceOrder({ ...order, status: 'failed' }).status).toBe('Cancelled');
  });
});

describe('toFinancePayout', () => {
  const payout: PayoutResponse = {
    id: 'po_1',
    organizationId: 'org_1',
    bankAccountId: 'ba_1',
    amountPaise: 486_200,
    status: 'paid',
    failureReason: null,
    processedAt: '2026-07-18T06:00:00.000Z',
    createdAt: '2026-07-17T06:00:00.000Z',
  };

  it('uses the processed date for a settled payout, not the request date', () => {
    expect(toFinancePayout(payout).date).toBe('18 Jul 2026');
  });

  it('surfaces the failure reason rather than a bare "Failed"', () => {
    const row = toFinancePayout({
      ...payout,
      status: 'failed',
      failureReason: 'Beneficiary account closed',
    });
    expect(row.detail).toBe('Failed · Beneficiary account closed');
  });

  it('falls back to the request date when a payout never processed', () => {
    const row = toFinancePayout({ ...payout, status: 'requested', processedAt: null });
    expect(row.date).toBe('17 Jul 2026');
  });
});

/* ─── Bank account ─────────────────────────────────────────────────────────── */

const bank: BankAccountResponse = {
  id: 'ba_1',
  bankName: 'HDFC Bank',
  accountHolder: 'Rhea Kapoor Events LLP',
  maskedAccountNumber: 'XXXX4321',
  ifscCode: 'HDFC0001234',
  isDefault: true,
  verified: true,
  createdAt: '2026-08-01T10:00:00.000Z',
};

describe('toFinanceBankAccount', () => {
  it('passes the mask through verbatim instead of reformatting it', () => {
    const row = toFinanceBankAccount(bank);
    expect(row.displayNumber).toBe('XXXX4321');
    // Structural guarantee: there is no field on the type that could hold the
    // real number, so no component can render one.
    expect(Object.keys(row).sort()).toEqual([
      'accountHolder',
      'bankName',
      'displayNumber',
      'ifscCode',
      'verified',
    ]);
  });

  it('carries the verification flag so an unverified account is called out', () => {
    expect(toFinanceBankAccount({ ...bank, verified: false }).verified).toBe(false);
  });

  it('renders an explicit "no account" state rather than empty strings', () => {
    const row = toFinanceBankAccount(null);
    expect(row.bankName).toBe('No payout account');
    expect(row.displayNumber).toBe('Not set');
    expect(row.verified).toBe(false);
  });
});

/* ─── Derived figures ──────────────────────────────────────────────────────── */

const inflow = (overrides: Partial<LedgerEntryDto>): LedgerEntryDto => ({
  id: 'led_1',
  orderId: 'ord_1',
  eventId: 'evt_1',
  entryType: 'host_payout',
  amountPaise: 100_000,
  status: 'settled',
  createdAt: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

describe('toBalanceTrend', () => {
  // Buckets are anchored to the calendar week containing `now`, counted back
  // 7 days at a time. With `now` = 10 Sep, index 7 is 4–10 Sep and index 6 is
  // 28 Aug–3 Sep. That anchoring is why the dates below are chosen carefully.
  const now = new Date('2026-09-10T00:00:00.000Z');
  const THIS_WEEK = '2026-09-08T00:00:00.000Z'; // 2 days ago → index 7
  const LAST_WEEK = '2026-09-01T00:00:00.000Z'; // 9 days ago → index 6

  it('returns one bucket per week, oldest first, zero-filled', () => {
    const trend = toBalanceTrend([], now);
    expect(trend).toHaveLength(8);
    expect(trend.every((value) => value === 0)).toBe(true);
  });

  it('counts settled inflow only — a pending entry is not money yet', () => {
    const trend = toBalanceTrend(
      [
        inflow({ amountPaise: 50_000, createdAt: THIS_WEEK }),
        inflow({ amountPaise: 70_000, status: 'pending', createdAt: THIS_WEEK }),
      ],
      now,
    );
    expect(trend[7]).toBe(50_000);
  });

  it('ignores outflows (platform fee, refunds)', () => {
    const trend = toBalanceTrend(
      [
        inflow({ amountPaise: 50_000, entryType: 'platform_fee', createdAt: THIS_WEEK }),
        inflow({ amountPaise: 40_000, createdAt: THIS_WEEK }),
      ],
      now,
    );
    expect(trend[7]).toBe(40_000);
  });

  it('buckets into the right week and drops anything older than the window', () => {
    const trend = toBalanceTrend(
      [
        inflow({ amountPaise: 10_000, createdAt: THIS_WEEK }),
        inflow({ amountPaise: 20_000, createdAt: LAST_WEEK }),
        inflow({ amountPaise: 30_000, createdAt: '2026-06-01T00:00:00.000Z' }), // too old
        // Future-dated (a backdated write, or a clock skew): must not be counted
        // into this week's bucket, which would overstate the current week.
        inflow({ amountPaise: 40_000, createdAt: '2026-09-20T00:00:00.000Z' }),
      ],
      now,
    );
    expect(trend[7]).toBe(10_000);
    expect(trend[6]).toBe(20_000);
    expect(trend.reduce((sum, value) => sum + value, 0)).toBe(30_000);
  });

  it('pads the gap so a quiet week reads flat instead of compressing the axis', () => {
    // Activity in the current week and three weeks ago, nothing between. If
    // empty buckets were omitted, the sparkline would show two adjacent points
    // and imply the money arrived last week.
    const trend = toBalanceTrend(
      [
        inflow({ amountPaise: 10_000, createdAt: THIS_WEEK }),
        inflow({ amountPaise: 30_000, createdAt: '2026-08-19T00:00:00.000Z' }),
      ],
      now,
    );
    expect(trend[7]).toBe(10_000);
    expect(trend[4]).toBe(30_000);
    expect(trend[5]).toBe(0);
    expect(trend[6]).toBe(0);
  });

  it('skips an unparseable createdAt rather than poisoning the bucket', () => {
    const trend = toBalanceTrend(
      [inflow({ amountPaise: 50_000, createdAt: 'nope' }), inflow({ amountPaise: 20_000, createdAt: THIS_WEEK })],
      now,
    );
    expect(trend[7]).toBe(20_000);
  });
});

describe('formatBalanceDelta', () => {
  const daysAgoIso = (days: number): string =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  it('says so when there is no settled income at all, instead of "0%"', () => {
    expect(formatBalanceDelta([])).toBe('No settled income yet');
  });

  it('does not claim a percentage when there is no baseline to divide by', () => {
    // A bare "+100%" off a zero prior week is a number with no meaning.
    const entries = [inflow({ amountPaise: 100_000, createdAt: daysAgoIso(1) })];
    expect(formatBalanceDelta(entries)).toBe('New income this week');
  });

  it('computes a real week-on-week change', () => {
    const entries = [
      inflow({ amountPaise: 150_000, createdAt: daysAgoIso(2) }),
      inflow({ amountPaise: 100_000, createdAt: daysAgoIso(9) }),
    ];
    expect(formatBalanceDelta(entries)).toBe('+50% week on week');
  });

  it('reports a decrease with a negative sign, not a bare number', () => {
    const entries = [
      inflow({ amountPaise: 50_000, createdAt: daysAgoIso(2) }),
      inflow({ amountPaise: 100_000, createdAt: daysAgoIso(9) }),
    ];
    expect(formatBalanceDelta(entries)).toBe('-50% week on week');
  });
});

describe('toNextPayoutMetric', () => {
  const payout: PayoutResponse = {
    id: 'po_1',
    organizationId: 'org_1',
    bankAccountId: 'ba_1',
    amountPaise: 486_200,
    status: 'requested',
    failureReason: null,
    processedAt: null,
    createdAt: '2026-07-17T06:00:00.000Z',
  };

  it('says "None scheduled" only when there is genuinely nothing', () => {
    expect(toNextPayoutMetric([])).toEqual({
      label: 'Next payout',
      value: 'None scheduled',
      detail: 'Request one from your available balance',
      tone: 'neutral',
    });
  });

  it('prefers a payout actually in flight over a settled one', () => {
    const metric = toNextPayoutMetric([
      { ...payout, id: 'po_old', status: 'paid', processedAt: '2026-07-01T00:00:00.000Z' },
      payout,
    ]);
    expect(metric.label).toBe('Next payout');
    expect(metric.value).toBe('₹4,862');
  });

  it('relabels the tile when the most recent payout already settled', () => {
    const metric = toNextPayoutMetric([
      { ...payout, status: 'paid', processedAt: '2026-07-18T00:00:00.000Z' },
    ]);
    expect(metric.label).toBe('Last payout');
  });

  it('escalates a failed payout so it is not mistaken for routine', () => {
    const metric = toNextPayoutMetric([{ ...payout, status: 'failed' }]);
    expect(metric.tone).toBe('negative');
    expect(metric.detail).toBe('Last attempt failed — check your bank account');
  });
});

/* ─── Whole-screen assembly ────────────────────────────────────────────────── */

const balances: BalanceSummaryResponse = {
  availablePaise: 486_200,
  pendingPaise: 120_000,
  lifetimePaise: 1_200_000,
};

describe('toPartnerFinanceData', () => {
  it('marks the result as API-backed', () => {
    const data = toPartnerFinanceData({
      accent: 'orange',
      balances,
      ledger: [],
      payouts: [],
      bankAccounts: [bank],
      orders: [order],
    });
    expect(data.dataStatus).toBe('api');
  });

  it('omits paymentCard entirely — no card is stored, so none is invented', () => {
    const data = toPartnerFinanceData({
      accent: 'orange',
      balances,
      ledger: [],
      payouts: [],
      bankAccounts: [bank],
      orders: [],
    });
    // `undefined`, not a fake card. `FinanceBankCards` branches on this to
    // render the "no card on file" state.
    expect(data.paymentCard).toBeUndefined();
  });

  it('picks the explicitly-requested account over the isDefault flag', () => {
    const data = toPartnerFinanceData({
      accent: 'orange',
      balances,
      ledger: [],
      payouts: [],
      bankAccounts: [
        { ...bank, id: 'ba_default', isDefault: true, bankName: 'Default Bank' },
        { ...bank, id: 'ba_chosen', bankName: 'Chosen Bank' },
      ],
      orders: [],
      defaultBankAccountId: 'ba_chosen',
    });
    expect(data.bankAccount.bankName).toBe('Chosen Bank');
  });

  it('falls back to the default, then the first, when no id is given', () => {
    const data = toPartnerFinanceData({
      accent: 'orange',
      balances,
      ledger: [],
      payouts: [],
      bankAccounts: [
        { ...bank, id: 'ba_a', isDefault: false, bankName: 'A' },
        { ...bank, id: 'ba_b', isDefault: true, bankName: 'B' },
      ],
      orders: [],
    });
    expect(data.bankAccount.bankName).toBe('B');
  });

  it('renders a zero balance as a real zero, not an empty tile', () => {
    const data = toPartnerFinanceData({
      accent: 'orange',
      balances: { availablePaise: 0, pendingPaise: 0, lifetimePaise: 0 },
      ledger: [],
      payouts: [],
      bankAccounts: [],
      orders: [],
    });
    expect(data.availableBalance).toBe('₹0');
    expect(data.pendingBalance.tone).toBe('neutral');
  });

  it('flags a non-zero pending balance as worth attention', () => {
    const data = toPartnerFinanceData({
      accent: 'orange',
      balances,
      ledger: [],
      payouts: [],
      bankAccounts: [],
      orders: [],
    });
    expect(data.pendingBalance.tone).toBe('warning');
    expect(data.pendingBalance.value).toBe('₹1,200');
  });

  it('maps every row it is given', () => {
    const data = toPartnerFinanceData({
      accent: 'lavender',
      balances,
      ledger: [],
      payouts: [
        {
          id: 'po_1',
          organizationId: 'org_1',
          bankAccountId: 'ba_1',
          amountPaise: 100_000,
          status: 'paid',
          failureReason: null,
          processedAt: '2026-07-18T00:00:00.000Z',
          createdAt: '2026-07-17T00:00:00.000Z',
        },
      ],
      bankAccounts: [bank],
      orders: [order, { ...order, id: 'ord_2' }],
    });
    expect(data.orders).toHaveLength(2);
    expect(data.payouts).toHaveLength(1);
    expect(data.accent).toBe('lavender');
  });
});
