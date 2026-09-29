import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getFinanceBalance,
  getPayout,
  listBankAccounts,
  listFinanceOrders,
  listLedgerEntries,
  listPayouts,
  requestPayout,
} from './api-finance-repository';

import type { FinanceApiClient } from './api-finance-repository';
import type {
  BankAccountResponse,
  FinanceOrderDto,
  LedgerEntryDto,
  PayoutResponse,
} from '@c1rcle/contracts';

/** Non-generic stand-in: the real client's methods are generic in the schema. */
type WireGet = (options: {
  readonly path: string;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
}) => Promise<unknown>;

const getMock = vi.fn<WireGet>();
const postMock = vi.fn<WireGet>();

/**
 * The client is injected rather than module-mocked, so these tests also prove
 * the repository has no hidden auth state of its own — a client component and a
 * server component can each hand it the one they own.
 *
 * The single cast is because `FinanceApiClient`'s methods are generic in the
 * response schema; a non-generic mock cannot satisfy them structurally. The
 * mocks stay typed where the assertions read them.
 */
const client = { get: getMock, post: postMock } as unknown as FinanceApiClient;

const paged = (items: readonly unknown[]) => ({
  items,
  pageInfo: { page: 1, pageSize: 20, total: items.length, hasNextPage: false },
});

const entry: LedgerEntryDto = {
  id: 'led_1',
  orderId: 'ord_1',
  eventId: 'evt_1',
  entryType: 'venue_share',
  amountPaise: 1_250_00,
  status: 'settled',
  createdAt: '2026-09-01T10:00:00.000Z',
};

const payout: PayoutResponse = {
  id: 'po_1',
  organizationId: 'org_1',
  bankAccountId: 'ba_1',
  amountPaise: 500_00,
  status: 'requested',
  failureReason: null,
  processedAt: null,
  createdAt: '2026-09-01T10:00:00.000Z',
};

const bank: BankAccountResponse = {
  id: 'ba_1',
  bankName: 'HDFC Bank',
  accountHolder: 'Rhea Kapoor',
  maskedAccountNumber: 'XXXX4321',
  ifscCode: 'HDFC0001234',
  isDefault: true,
  verified: true,
  createdAt: '2026-08-01T10:00:00.000Z',
};

const order: FinanceOrderDto = {
  id: 'ord_1',
  eventId: 'evt_1',
  eventName: 'Neon Rooftop',
  buyerName: 'Aarav Mehta',
  ticketCount: 3,
  currency: 'INR',
  grandTotalPaise: 2_500_00,
  refundedPaise: 0,
  status: 'paid',
  paidAt: '2026-09-01T10:05:00.000Z',
  createdAt: '2026-09-01T10:00:00.000Z',
};

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
});

describe('getFinanceBalance', () => {
  it('reads the org-scoped balance and returns integer paise unchanged', async () => {
    getMock.mockResolvedValue({ availablePaise: 10_00, pendingPaise: 0, lifetimePaise: 90_00 });

    const balances = await getFinanceBalance(client, 'org_1');

    expect(getMock.mock.calls[0]?.[0]?.path).toBe('/api/v2/organizations/org_1/finance/balance');
    // No rounding or formatting here — money stays paise until the UI formats it.
    expect(balances.availablePaise).toBe(1000);
  });

  it('encodes the organization id', async () => {
    getMock.mockResolvedValue({ availablePaise: 0, pendingPaise: 0, lifetimePaise: 0 });

    await getFinanceBalance(client, 'org/1');

    expect(getMock.mock.calls[0]?.[0]?.path).toBe('/api/v2/organizations/org%2F1/finance/balance');
  });
});

describe('listLedgerEntries', () => {
  it('omits the query string entirely when no cursor or limit is given', async () => {
    getMock.mockResolvedValue(paged([entry]));

    await listLedgerEntries(client, 'org_1');

    expect(getMock.mock.calls[0]?.[0]?.path).toBe('/api/v2/organizations/org_1/finance/ledger');
  });

  it('surfaces hasNextPage, since pageInfo carries no cursor to re-send', async () => {
    getMock.mockResolvedValue({
      items: [entry],
      pageInfo: { page: 1, pageSize: 20, total: 100, hasNextPage: true },
    });

    const page = await listLedgerEntries(client, 'org_1', { limit: 20 });

    expect(page.total).toBe(100);
    expect(page.hasNextPage).toBe(true);
  });

  it('passes cursor and limit through as query params', async () => {
    getMock.mockResolvedValue(paged([]));

    await listLedgerEntries(client, 'org_1', { cursor: 'cur_abc', limit: 5 });

    expect(getMock.mock.calls[0]?.[0]?.path).toBe(
      '/api/v2/organizations/org_1/finance/ledger?limit=5&cursor=cur_abc',
    );
  });
});

describe('listFinanceOrders', () => {
  it('reads the org-scoped finance sub-path, not the buyer-scoped /orders', async () => {
    getMock.mockResolvedValue(paged([order]));

    const page = await listFinanceOrders(client, 'org_1');

    expect(getMock.mock.calls[0]?.[0]?.path).toBe('/api/v2/organizations/org_1/finance/orders');
    expect(page.items).toEqual([order]);
    expect(page.total).toBe(1);
  });

  it('passes limit and cursor through as query params', async () => {
    getMock.mockResolvedValue(paged([]));

    await listFinanceOrders(client, 'org_1', { limit: 50, cursor: 'cur_xyz' });

    expect(getMock.mock.calls[0]?.[0]?.path).toBe(
      '/api/v2/organizations/org_1/finance/orders?limit=50&cursor=cur_xyz',
    );
  });

  it('returns the DTO untouched — the server already resolved the event name', async () => {
    getMock.mockResolvedValue(paged([order]));

    const page = await listFinanceOrders(client, 'org_1');

    // No client-side event lookup, no re-formatting of paise. The row the table
    // renders is the row the backend sent.
    expect(page.items[0]?.eventName).toBe('Neon Rooftop');
    expect(page.items[0]?.grandTotalPaise).toBe(250_000);
  });

  it('never receives buyer contact details, only a display name', async () => {
    getMock.mockResolvedValue(paged([order]));

    const page = await listFinanceOrders(client, 'org_1');

    // The schema has no email/phone field at all, so there is nothing for the
    // table to leak even if a future component tried to render it.
    expect(Object.keys(page.items[0] ?? {}).sort()).toEqual([
      'buyerName',
      'createdAt',
      'currency',
      'eventId',
      'eventName',
      'grandTotalPaise',
      'id',
      'paidAt',
      'refundedPaise',
      'status',
      'ticketCount',
    ]);
  });
});

describe('listPayouts', () => {
  it('lists payouts from the org-scoped collection, not the finance sub-path', async () => {
    getMock.mockResolvedValue(paged([payout]));

    const page = await listPayouts(client, 'org_1');

    expect(getMock.mock.calls[0]?.[0]?.path).toBe('/api/v2/organizations/org_1/payouts');
    expect(page.items).toEqual([payout]);
  });
});

describe('getPayout', () => {
  it('encodes both ids', async () => {
    getMock.mockResolvedValue(payout);

    await getPayout(client, 'org/1', 'po/1');

    expect(getMock.mock.calls[0]?.[0]?.path).toBe('/api/v2/organizations/org%2F1/payouts/po%2F1');
  });
});

describe('listBankAccounts', () => {
  it('returns masked accounts and never a plaintext number', async () => {
    getMock.mockResolvedValue({ items: [bank] });

    const accounts = await listBankAccounts(client, 'org_1');

    expect(accounts).toEqual([bank]);
    // The response schema has no plaintext field to leak, so the UI physically
    // cannot render a full account number.
    expect(Object.keys(accounts[0] ?? {})).not.toContain('accountNumber');
  });
});

describe('requestPayout', () => {
  it('sends amountPaise with the idempotency key in both body and header', async () => {
    postMock.mockResolvedValue(payout);

    await requestPayout(client, 'org_1', { amountPaise: 500_00 }, 'intent-1');

    const init = postMock.mock.calls[0]?.[0];
    expect(init?.path).toBe('/api/v2/organizations/org_1/payouts');
    expect(init?.body).toEqual({ amountPaise: 500_00, idempotencyKey: 'intent-1' });
    expect(init?.headers?.['Idempotency-Key']).toBe('intent-1');
  });

  it('omits bankAccountId so the backend falls back to the default account', async () => {
    postMock.mockResolvedValue(payout);

    await requestPayout(client, 'org_1', { amountPaise: 100_00 }, 'intent-2');

    // `.strict()` on payoutRequestSchema would reject an explicit undefined.
    expect(postMock.mock.calls[0]?.[0]?.body).toEqual({
      amountPaise: 100_00,
      idempotencyKey: 'intent-2',
    });
  });

  it('includes bankAccountId when the user picked one', async () => {
    postMock.mockResolvedValue(payout);

    await requestPayout(
      client,
      'org_1',
      { amountPaise: 100_00, bankAccountId: 'ba_9' },
      'intent-3',
    );

    expect(postMock.mock.calls[0]?.[0]?.body).toEqual({
      amountPaise: 100_00,
      bankAccountId: 'ba_9',
      idempotencyKey: 'intent-3',
    });
  });
});
