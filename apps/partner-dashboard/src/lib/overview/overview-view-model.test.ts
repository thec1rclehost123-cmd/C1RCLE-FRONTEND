import { describe, expect, it } from 'vitest';

import { toOverviewData } from './overview-view-model';

import type {
  OrganizationCalendarDto,
  OrganizationEventCardDto,
  OrganizationEventCardListResponse,
  OrganizationOverviewDto,
  OrganizationTrendsDto,
  TrendBucketDto,
} from '@c1rcle/contracts';

const NOW = new Date('2026-09-16T12:00:00.000Z');

const OVERVIEW: OrganizationOverviewDto = {
  organizationId: 'org_1',
  totalEvents: 12,
  publishedEvents: 9,
  totalRevenuePaise: 2_450_000_00,
  totalTicketsSold: 1_160,
  totalCheckIns: 900,
  topEvents: [],
  lastEventAt: '2026-09-01T18:00:00.000Z',
};

/**
 * The zod-inferred DTOs use **mutable** arrays, so these factories return
 * mutable arrays too. A `readonly` return here fails to typecheck only under
 * `next build` (which typechecks test files) while `tsc --noEmit` over the app
 * `tsconfig.json` skips them — the same class of gap `tsc` and `vitest` both
 * miss and the production build catches.
 */
function buckets(
  keys: readonly string[],
  value: { revenuePaise: number; tickets: number; checkIns: number },
): TrendBucketDto[] {
  return keys.map((key) => ({ key, ...value }));
}

function trends(over: Partial<OrganizationTrendsDto> = {}): OrganizationTrendsDto {
  return {
    organizationId: 'org_1',
    granularity: 'day',
    from: '2026-09-01',
    to: '2026-09-16',
    buckets: [],
    totals: { revenuePaise: 0, tickets: 0, checkIns: 0 },
    ...over,
  };
}

const CALENDAR: OrganizationCalendarDto = {
  organizationId: 'org_1',
  month: '2026-09',
  // 2026-09-01 is a Tuesday.
  firstDayOffset: 1,
  days: Array.from({ length: 30 }, (_, index) => ({ day: index + 1, eventCount: 0 })),
};

function card(over: Partial<OrganizationEventCardDto> = {}): OrganizationEventCardDto {
  return {
    eventId: 'evt_1',
    title: 'Neon Nights',
    startAt: '2026-09-20T18:00:00.000Z',
    status: 'published',
    venueId: 'ven_1',
    venueName: 'Sky Bar',
    imageUrl: null,
    ticketsSold: 120,
    capacity: 400,
    ...over,
  };
}

function cards(items: OrganizationEventCardDto[]): OrganizationEventCardListResponse {
  return { organizationId: 'org_1', items };
}

function build(
  over: {
    hourly?: OrganizationTrendsDto;
    daily?: OrganizationTrendsDto;
    monthly?: OrganizationTrendsDto;
    calendar?: OrganizationCalendarDto;
    cards?: OrganizationEventCardListResponse;
    displayName?: string | null;
    network?: Parameters<typeof toOverviewData>[0]['network'];
    activity?: Parameters<typeof toOverviewData>[0]['activity'];
  } = {},
) {
  return toOverviewData({
    accent: 'orange',
    overview: OVERVIEW,
    hourly: over.hourly ?? trends(),
    daily: over.daily ?? trends(),
    monthly: over.monthly ?? trends(),
    calendar: over.calendar ?? CALENDAR,
    cards: over.cards ?? cards([card()]),
    displayName: over.displayName === undefined ? 'Rhea Kapoor' : over.displayName,
    network: over.network ?? [],
    activity: over.activity ?? [],
    now: NOW,
  });
}

describe('toOverviewData', () => {
  it('marks the data as API-backed, never fixture', () => {
    expect(build().dataStatus).toBe('api');
  });

  it('formats today in UTC so hydration cannot disagree', () => {
    // 2026-09-16 is a Wednesday. A local-time formatter would render a
    // different weekday for a partner west of the server.
    expect(build().todayLabel).toBe('Wednesday, 16 September · 12:00 PM');
  });

  it('greet by first name only', () => {
    expect(build({ displayName: 'Rhea Kapoor' }).greeting).toBe('Good afternoon, Rhea');
  });

  it('greets without claiming a name it does not have', () => {
    expect(build({ displayName: null }).greeting).toBe('Good afternoon');
  });

  it('omits the doors label because the backend has no doors time', () => {
    // Inferred from start time it would be a fact about the night the partner
    // never set and can be wrong about.
    expect(build().nextEvent.doorsLabel).toBeUndefined();
  });

  it('preserves an undeclared capacity as null rather than coercing to 0', () => {
    const data = build({ cards: cards([card({ capacity: null })]) });

    expect(data.nextEvent.capacity).toBeNull();
  });

  it('says venue to be announced when there is no venue name', () => {
    const data = build({ cards: cards([card({ venueName: null, venueId: null })]) });

    expect(data.nextEvent.venue).toBe('Venue to be announced');
  });

  it('uses the placeholder event when nothing is scheduled', () => {
    const data = build({ cards: cards([]) });

    expect(data.nextEvent.name).toBe('No upcoming events');
    expect(data.upcomingEvents).toEqual([]);
  });

  it('treats an unrecognised status as a draft rather than live', () => {
    const data = build({ cards: cards([card({ status: 'some_new_status' })]) });

    // Rendering an unknown status as "live" would be the worst possible guess.
    expect(data.nextEvent.status).toBe('draft');
  });

  it('splits the first card into the hero and the rest into upcoming', () => {
    const data = build({
      cards: cards([
        card({ eventId: 'evt_1', title: 'First' }),
        card({ eventId: 'evt_2', title: 'Second' }),
        card({ eventId: 'evt_3', title: 'Third' }),
      ]),
    });

    expect(data.nextEvent.name).toBe('First');
    expect(data.upcomingEvents.map((event) => event.name)).toEqual(['Second', 'Third']);
  });

  it('builds every metric and range the card toggles through', () => {
    // The trend card switches metric and range client-side off this array, so a
    // missing combination would silently fall back to series[0].
    const data = build();

    expect(data.trends.map((entry) => `${entry.metric}:${entry.range}`)).toEqual([
      'tickets:1D',
      'tickets:1W',
      'tickets:1M',
      'tickets:All',
      'revenue:1D',
      'revenue:1W',
      'revenue:1M',
      'revenue:All',
    ]);
  });

  it('carries no clicks series, because none exists', () => {
    // Clicks are a per-promoter vanity counter with no org-level source.
    expect(build().trends.some((entry) => entry.metric === 'clicks')).toBe(false);
  });

  it('reports the window total, not the plotted sub-sample', () => {
    // 1W plots 7 of 30 daily buckets. Summing only the plotted ones would
    // understate the week by three quarters.
    const data = build({
      daily: trends({
        buckets: buckets(
          Array.from(
            { length: 30 },
            (_, index) => `2026-08-${String(index + 18).padStart(2, '0')}`,
          ),
          { revenuePaise: 0, tickets: 10, checkIns: 0 },
        ),
      }),
    });

    const week = data.trends.find((entry) => entry.metric === 'tickets' && entry.range === '1W');
    expect(week?.value).toBe('70');
    expect(week?.points).toHaveLength(7);
  });

  it('plots 12 hourly points for the 1D range', () => {
    const data = build({
      hourly: trends({
        granularity: 'hour',
        buckets: buckets(
          Array.from({ length: 24 }, (_, hour) => `2026-09-16T${String(hour).padStart(2, '0')}:00`),
          { revenuePaise: 0, tickets: 5, checkIns: 0 },
        ),
      }),
    });

    const day = data.trends.find((entry) => entry.metric === 'tickets' && entry.range === '1D');
    expect(day?.points).toHaveLength(12);
    // The whole 24 hours, not the 12 plotted.
    expect(day?.value).toBe('120');
  });

  it('keeps the most recent bucket when sub-sampling', () => {
    const data = build({
      daily: trends({
        buckets: buckets(
          Array.from({ length: 30 }, (_, index) => `2026-09-${String(index + 1).padStart(2, '0')}`),
          { revenuePaise: 0, tickets: 0, checkIns: 0 },
        ).map((bucket, index) => ({ ...bucket, tickets: index + 1 })),
      }),
    });

    const week = data.trends.find((entry) => entry.metric === 'tickets' && entry.range === '1W');
    // The trailing bucket is the most recent day; dropping it would make
    // today's sales invisible on a chart whose whole point is today.
    expect(week?.points.at(-1)).toBe(30);
  });

  it('shows a plain zero total for an org with no sales', () => {
    const data = build();

    const week = data.trends.find((entry) => entry.metric === 'revenue' && entry.range === '1W');
    expect(week?.value).toBe('₹0');
  });

  it('says "All" covers a bounded window, not forever', () => {
    const data = build();

    const all = data.trends.find((entry) => entry.metric === 'tickets' && entry.range === 'All');
    // The monthly read is bounded, so claiming "All time" would overstate the
    // window the chart actually covers.
    expect(all?.caption).toBe('Last 24 months, by month');
  });

  it('reports "—" for a delta with no preceding window to compare', () => {
    const data = build();

    const all = data.trends.find((entry) => entry.metric === 'tickets' && entry.range === 'All');
    expect(all?.delta).toBe('—');
  });

  it('labels growth from zero as new rather than inventing a percentage', () => {
    // The 1W range plots the trailing 7 daily buckets and compares the recent
    // half against the half before it, so the zero side has to be inside those
    // 7 — an earlier all-zero stretch is outside the window entirely.
    const data = build({
      daily: trends({
        buckets: Array.from({ length: 30 }, (_, index) => ({
          key: `2026-09-${String(index + 1).padStart(2, '0')}`,
          revenuePaise: 0,
          // Buckets 27..30 (the most recent four) have sales; 26 and before do not.
          tickets: index >= 26 ? 4 : 0,
          checkIns: 0,
        })),
      }),
    });

    const week = data.trends.find((entry) => entry.metric === 'tickets' && entry.range === '1W');
    // Growth from zero is unbounded; any percentage here would be fiction.
    expect(week?.delta).toBe('New');
  });

  it('compares the recent half of a window against the half before it', () => {
    // Trailing 7 daily buckets: 10, 10, 10, 20, 20, 20, 20. Previous half sums
    // to 30, the recent half to 80, so the delta is +167%.
    const data = build({
      daily: trends({
        buckets: Array.from({ length: 30 }, (_, index) => ({
          key: `2026-09-${String(index + 1).padStart(2, '0')}`,
          revenuePaise: 0,
          tickets: index < 23 ? 0 : index < 26 ? 10 : 20,
          checkIns: 0,
        })),
      }),
    });

    const week = data.trends.find((entry) => entry.metric === 'tickets' && entry.range === '1W');
    expect(week?.delta).toBe('+167%');
  });

  it('marks only today in the calendar', () => {
    const data = build();

    expect(data.calendar.days.find((day) => day.isToday)?.day).toBe(16);
    expect(data.calendar.days).toHaveLength(30);
  });

  it('carries a zero event count rather than omitting idle days', () => {
    const data = build();

    // The grid lays out every cell; a missing count reads as missing data.
    expect(data.calendar.days[0]).toEqual({ day: 1, eventCount: 0, isToday: false });
  });

  it('does not mark today when the month is not the current one', () => {
    const data = build({ calendar: { ...CALENDAR, month: '2026-08' } });

    expect(data.calendar.days.some((day) => day.isToday)).toBe(false);
    expect(data.calendar.monthLabel).toBe('August 2026');
  });

  it('signs activity amounts by direction', () => {
    const data = build({
      activity: [
        {
          id: 'a',
          kind: 'ticket',
          name: 'Aisha',
          meta: '2× GA',
          amountPaise: 500_000,
          occurredAt: '2026-09-16T10:00:00.000Z',
        },
        {
          id: 'b',
          kind: 'refund',
          name: 'Meera',
          meta: '1× GA',
          amountPaise: -180_000,
          occurredAt: '2026-09-16T11:00:00.000Z',
        },
      ],
    });

    // Newest first, regardless of the order they were supplied in.
    expect(data.recentActivity.map((entry) => entry.id)).toEqual(['b', 'a']);
    expect(data.recentActivity[0]?.amount).toBe('− ₹1,800');
    expect(data.recentActivity[1]?.amount).toBe('+ ₹5,000');
  });

  it('shows a short org id for a counterparty, never an invented name', () => {
    const data = build({
      network: [
        {
          partnershipId: 'prt_1',
          counterpartyOrganizationId: 'org_counterparty_long_id',
          side: 'host',
          status: 'active',
        },
      ],
    });

    // There is no endpoint that resolves an org the viewer is not a member of.
    expect(data.network[0]?.name).toBe('org_coun…');
  });
});
