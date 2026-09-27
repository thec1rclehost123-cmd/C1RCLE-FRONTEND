import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FinanceLoadError, loadFinanceData } from './load-finance-data';

import type { ServerApiClient } from '@/lib/api/server-client';

const cookieMock = vi.hoisted(() => vi.fn(() => 'c1rcle.active-org=org_1; session=abc'));

// `server-only`'s published `default` condition is a module that throws on
// import — the guard only passes under the `react-server` condition, which
// vitest does not set. Stubbing it is the standard way to unit-test a
// `server-only` module; the real guard is enforced by the Next.js build, which
// is where it actually protects anything.
vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: () => ({ toString: () => cookieMock() }),
}));

/** A non-generic stand-in: the real client's methods are generic in the schema. */
type WireGet = (options: { readonly path: string }) => Promise<unknown>;

const getMock = vi.fn<WireGet>();
const postMock = vi.fn<WireGet>();

// One cast, because `ServerApiClient`'s methods are generic in the response
// schema and a non-generic mock cannot satisfy them structurally. The mocks
// stay precisely typed where the assertions actually read them.
const client = { get: getMock, post: postMock } as unknown as ServerApiClient;

const BALANCE = { availablePaise: 486_200, pendingPaise: 0, lifetimePaise: 1_200_000 };
const PAGE = { items: [], pageInfo: { page: 1, pageSize: 50, total: 0, hasNextPage: false } };

beforeEach(() => {
  cookieMock.mockReset();
  cookieMock.mockReturnValue('c1rcle.active-org=org_1; session=abc');
  getMock.mockReset();
  postMock.mockReset();
  getMock.mockImplementation(({ path }) => {
    if (path.endsWith('/finance/balance')) return Promise.resolve(BALANCE);
    if (path.endsWith('/bank-accounts')) return Promise.resolve({ items: [] });
    return Promise.resolve(PAGE);
  });
});

describe('loadFinanceData', () => {
  it('reads the org id out of the request cookie header', async () => {
    const data = await loadFinanceData({ accent: 'orange', client });

    expect(data.dataStatus).toBe('api');
    const balanceCall = getMock.mock.calls.find((call) =>
      call[0].path.endsWith('/finance/balance'),
    );
    expect(balanceCall?.[0].path).toBe('/api/v2/organizations/org_1/finance/balance');
  });

  it('issues the five reads concurrently, not one after another', async () => {
    await loadFinanceData({ accent: 'orange', client });

    // All five must be in flight before any resolves — serialising them would
    // make time-to-first-paint the sum of five round-trips.
    expect(getMock).toHaveBeenCalledTimes(5);
    const paths = getMock.mock.calls.map((call) => call[0].path);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/api/v2/organizations/org_1/finance/balance',
        '/api/v2/organizations/org_1/finance/ledger?limit=50',
        '/api/v2/organizations/org_1/payouts?limit=50',
        '/api/v2/organizations/org_1/bank-accounts',
        '/api/v2/organizations/org_1/finance/orders?limit=50',
      ]),
    );
  });

  it('refuses to guess a tenant when no org is selected', async () => {
    cookieMock.mockReturnValue('session=abc');

    await expect(loadFinanceData({ accent: 'orange', client })).rejects.toBeInstanceOf(
      FinanceLoadError,
    );
    // Crucially: no request at all. Guessing an org id here would show one
    // tenant's money to another.
    expect(getMock).not.toHaveBeenCalled();
  });

  it('throws rather than degrading to fixture numbers when a read fails', async () => {
    getMock.mockRejectedValue(new Error('gateway 500'));

    // The whole point: a real balance must never silently become a placeholder
    // one sitting next to real bank details.
    const error = await loadFinanceData({ accent: 'orange', client }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FinanceLoadError);
    expect((error as FinanceLoadError).reason).toBe('api');
  });

  it('keeps the underlying error as the cause so the cause is debuggable', async () => {
    const cause = new Error('gateway 500');
    getMock.mockRejectedValue(cause);

    const error = await loadFinanceData({ accent: 'orange', client }).catch((e: unknown) => e);

    expect((error as FinanceLoadError).cause).toBe(cause);
  });

  it('accepts an explicit organizationId over the cookie', async () => {
    await loadFinanceData({ accent: 'orange', client, organizationId: 'org_explicit' });

    expect(getMock.mock.calls[0]?.[0]?.path).toContain('/organizations/org_explicit/');
  });
});
