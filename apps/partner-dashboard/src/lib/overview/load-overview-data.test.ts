import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

import { classifyOverviewFailure, loadOverviewData, OverviewLoadError } from './load-overview-data';

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

const NOW = new Date('2026-09-16T12:00:00.000Z');

const OVERVIEW = {
  organizationId: 'org_1',
  totalEvents: 3,
  publishedEvents: 2,
  totalRevenuePaise: 500_000,
  totalTicketsSold: 40,
  totalCheckIns: 12,
  topEvents: [],
  lastEventAt: null,
};

const CARD = {
  eventId: 'evt_1',
  title: 'Neon Nights',
  startAt: '2026-09-20T18:00:00.000Z',
  status: 'published',
  venueId: 'ven_1',
  venueName: 'Sky Bar',
  imageUrl: null,
  ticketsSold: 120,
  capacity: 400,
};

/**
 * `ApiClientError` takes a discriminated `code`, not a bare status — the status
 * is only ever a field *of* a code. Building one by status would construct an
 * error the client itself can never produce.
 */
function apiError(code: 'unauthorized' | 'forbidden' | 'server', status: number): ApiClientError {
  return new ApiClientError({
    code,
    message: 'boom',
    status,
    requestId: undefined,
    fieldErrors: undefined,
  });
}

function emptyTrends(path: string) {
  const hourly = path.includes('granularity=hour');
  const monthly = path.includes('granularity=month');
  return {
    organizationId: 'org_1',
    granularity: hourly ? 'hour' : monthly ? 'month' : 'day',
    from: '2026-09-01',
    to: '2026-09-16',
    buckets: [],
    totals: { revenuePaise: 0, tickets: 0, checkIns: 0 },
  };
}

beforeEach(() => {
  cookieMock.mockReset();
  cookieMock.mockReturnValue('c1rcle.active-org=org_1; session=abc');
  getMock.mockReset();
  postMock.mockReset();
  getMock.mockImplementation(({ path }) => {
    if (path.endsWith('/analytics/overview')) return Promise.resolve(OVERVIEW);
    if (path.includes('/analytics/trends')) return Promise.resolve(emptyTrends(path));
    if (path.includes('/analytics/calendar')) {
      return Promise.resolve({
        organizationId: 'org_1',
        month: '2026-09',
        firstDayOffset: 1,
        days: Array.from({ length: 30 }, (_, index) => ({ day: index + 1, eventCount: 0 })),
      });
    }
    if (path.includes('/analytics/events')) {
      return Promise.resolve({ organizationId: 'org_1', items: [CARD] });
    }
    return Promise.reject(new Error(`unstubbed path: ${path}`));
  });
});

describe('loadOverviewData', () => {
  it('reads the org id out of the request cookie header', async () => {
    const data = await loadOverviewData({ accent: 'orange', client, now: NOW });

    expect(data.dataStatus).toBe('api');
    for (const call of getMock.mock.calls) {
      expect(call[0].path).toContain('/organizations/org_1/');
    }
  });

  it('requests each range at the bucket width it needs', async () => {
    await loadOverviewData({ accent: 'orange', client, now: NOW });

    const paths = getMock.mock.calls.map((call) => call[0].path);
    // Today by the hour, a month by day, two years by month. One granularity
    // cannot serve all three: 1D would be one bar and All would be 400 points.
    expect(paths.some((path) => path.includes('granularity=hour'))).toBe(true);
    expect(paths.some((path) => path.includes('granularity=day'))).toBe(true);
    expect(paths.some((path) => path.includes('granularity=month'))).toBe(true);
  });

  it('asks for a 30-day window so one read serves both the 1W and 1M ranges', async () => {
    await loadOverviewData({ accent: 'orange', client, now: NOW });

    const daily = getMock.mock.calls
      .map((call) => call[0].path)
      .find((path) => path.includes('granularity=day'));
    expect(daily).toContain('from=2026-08-18');
    expect(daily).toContain('to=2026-09-16');
  });

  it('sends an explicit limit on the event cards', async () => {
    await loadOverviewData({ accent: 'orange', client, now: NOW });

    const cards = getMock.mock.calls
      .map((call) => call[0].path)
      .find((path) => path.includes('/analytics/events'));
    expect(cards).toContain('limit=4');
  });

  it('refuses to read anything without an active organization', async () => {
    cookieMock.mockReturnValue('session=abc');

    const error = await loadOverviewData({ accent: 'orange', client, now: NOW }).catch(
      (cause: unknown) => cause,
    );

    expect(error).toBeInstanceOf(OverviewLoadError);
    expect((error as OverviewLoadError).reason).toBe('no-organization');
    // Nothing was fetched: there was no tenant to fetch it for.
    expect(getMock).not.toHaveBeenCalled();
  });

  it('throws rather than degrading to fixture numbers', async () => {
    getMock.mockImplementation(() => Promise.reject(apiError('server', 500)));

    const error = await loadOverviewData({ accent: 'orange', client, now: NOW }).catch(
      (cause: unknown) => cause,
    );

    // A 500 must not leave a real event list next to a fixture revenue chart.
    expect(error).toBeInstanceOf(OverviewLoadError);
    expect((error as OverviewLoadError).reason).toBe('api');
  });

  it('rethrows the original cause so the page can tell terminal from transient', async () => {
    getMock.mockImplementation(() => Promise.reject(apiError('unauthorized', 401)));

    const error = (await loadOverviewData({
      accent: 'orange',
      client,
      now: NOW,
    }).catch((cause: unknown) => cause)) as OverviewLoadError;

    expect(error.reason).toBe('signed-out');
    expect(error.cause).toBeInstanceOf(ApiClientError);
  });

  it('fixes one instant for every window so the reads cannot straddle midnight', async () => {
    await loadOverviewData({ accent: 'orange', client, now: NOW });

    const paths = getMock.mock.calls.map((call) => call[0].path);
    // Every "to" bound is the same day, derived from the injected `now`.
    const tos = paths
      .filter((path) => path.includes('to='))
      .map((path) => path.slice(path.indexOf('to=') + 3).split('&')[0]);
    expect(new Set(tos)).toEqual(new Set(['2026-09-16']));
  });
});

describe('classifyOverviewFailure', () => {
  it('maps a 401 to signed-out', () => {
    expect(classifyOverviewFailure(apiError('unauthorized', 401))).toBe('signed-out');
  });

  it('maps a 403 to forbidden, not retryable', () => {
    // Signed in, just not a member. A retry button here can never succeed.
    expect(classifyOverviewFailure(apiError('forbidden', 403))).toBe('forbidden');
  });

  it('maps anything else to api', () => {
    expect(classifyOverviewFailure(apiError('server', 500))).toBe('api');
    expect(classifyOverviewFailure(new Error('network'))).toBe('api');
    expect(classifyOverviewFailure('a string')).toBe('api');
  });
});
