import { describe, expect, it } from 'vitest';

import {
  formatRelativeOrderTime,
  formatTicketSummary,
  toOverviewData,
} from './overview-view-model';

import type {
  FinanceOrderDto,
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
  return keys.map((key) => ({
    key,
    ...value,
    totalTicketsIssued: 0,
    paidTickets: 0,
    freeRsvpTickets: 0,
    paidOrderCount: 0,
    guestGrossCollectedPaise: 0,
    ticketRevenuePaise: 0,
  }));
}

function trends(over: Partial<OrganizationTrendsDto> = {}): OrganizationTrendsDto {
  return {
    organizationId: 'org_1',
    granularity: 'day',
    from: '2026-09-01',
    to: '2026-09-16',
    buckets: [],
    totals: {
      revenuePaise: 0,
      tickets: 0,
      checkIns: 0,
      totalTicketsIssued: 0,
      paidTickets: 0,
      freeRsvpTickets: 0,
      paidOrderCount: 0,
      guestGrossCollectedPaise: 0,
      ticketRevenuePaise: 0,
    },
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
    recentOrders?: Parameters<typeof toOverviewData>[0]['recentOrders'];
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
    recentOrders: over.recentOrders === undefined ? [] : over.recentOrders,
    now: NOW,
  });
}

describe('toOverviewData', () => {
  it('formats recent order age without exposing event or ticket details', () => {
    const now = new Date('2026-09-16T12:00:00.000Z');
    expect(formatRelativeOrderTime('2026-09-16T11:58:00.000Z', now)).toBe('2m ago');
    expect(formatRelativeOrderTime('2026-09-16T10:00:00.000Z', now)).toBe('2h ago');
    expect(formatRelativeOrderTime('2026-09-13T12:00:00.000Z', now)).toBe('3d ago');
    expect(formatRelativeOrderTime('invalid', now)).toBe('Time unavailable');
  });

  it('formats ticket tiers before relative time in recent orders', () => {
    expect(formatTicketSummary([{ tierName: 'General Admission', quantity: 2 }])).toBe(
      '2 × General Admission',
    );
    expect(
      formatTicketSummary([
        { tierName: 'VIP', quantity: 1 },
        { tierName: 'GA', quantity: 2 },
      ]),
    ).toBe('1 × VIP + 2 × GA');
    expect(formatTicketSummary([])).toBe('Tickets');
  });

  it('colors only settled paid orders positively and completed refunds negatively', () => {
    const order = (
      id: string,
      status: FinanceOrderDto['status'],
      total: number,
      refunded: number,
    ): FinanceOrderDto => ({
      id,
      eventId: 'evt_1',
      eventName: 'Neon Nights',
      buyerName: 'Guest',
      ticketCount: 1,
      currency: 'INR',
      grandTotalPaise: total,
      gstPaise: 0,
      refundedPaise: refunded,
      status,
      paidAt: '2026-09-15T12:00:00.000Z',
      createdAt: '2026-09-15T12:00:00.000Z',
    });
    const data = build({
      recentOrders: [
        order('paid', 'paid', 10_000, 0),
        order('refunded', 'refunded', 10_000, 10_000),
        order('pending', 'pending', 10_000, 0),
        order('free', 'paid', 0, 0),
      ],
    });

    expect(data.recentOrders?.map((item) => item.amountTone)).toEqual([
      'positive',
      'negative',
      'neutral',
      'neutral',
    ]);
  });

  it('formats Host event date and time in India Standard Time', () => {
    const data = build({
      cards: cards([card({ startAt: '2026-11-16T13:30:00.000Z' })]),
    });
    expect(data.nextEvent.dateLabel).toBe('16 Nov');
    expect(data.nextEvent.timeLabel).toMatch(/7:00\s*pm/i);
  });

  it('marks the data as API-backed, never fixture', () => {
    expect(build().dataStatus).toBe('api');
  });

  it('formats today and the greeting in the fixed product timezone', () => {
    // 2026-09-16 12:00 UTC is 17:30 in the fixed product timezone.
    expect(build().todayLabel).toBe('Wednesday, 16 September · 5:30 PM');
  });

  it('greet by first name only', () => {
    expect(build({ displayName: 'Rhea Kapoor' }).greeting).toBe('Good evening, Rhea');
  });

  it('greets without claiming a name it does not have', () => {
    expect(build({ displayName: null }).greeting).toBe('Good evening');
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

  it('keeps future drafts out of the hero and upcoming events', () => {
    const data = build({
      cards: cards([
        card({ eventId: 'draft', title: 'Draft party', status: 'draft' }),
        card({ eventId: 'published', title: 'Published party' }),
      ]),
    });

    expect(data.nextEvent.name).toBe('Published party');
    expect(data.upcomingEvents).toEqual([]);
  });

  it('shows a draft-specific empty state when no eligible event exists', () => {
    const data = build({ cards: cards([card({ status: 'draft' })]) });

    expect(data.nextEvent.name).toBe('No upcoming events');
    expect(data.nextEvent.venue).toBe('Draft events are in Events');
    expect(data.upcomingEvents).toEqual([]);
  });

  it('does not keep published events in upcoming after their start time', () => {
    const data = build({
      cards: cards([card({ startAt: '2026-09-16T11:00:00.000Z' })]),
    });

    expect(data.nextEvent.name).toBe('No upcoming events');
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
    expect(week?.pointLabels).toHaveLength(7);
    expect(week?.pointLabels?.at(-1)).toBe('30 Sept');
    const month = data.trends.find((entry) => entry.metric === 'tickets' && entry.range === '1M');
    expect(month?.pointLabels?.[0]).toBe('1 Sept – 2 Sept');
    expect(month?.pointLabels).toHaveLength(month?.points.length ?? 0);
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
          totalTicketsIssued: 0,
          paidTickets: 0,
          freeRsvpTickets: 0,
          paidOrderCount: 0,
          guestGrossCollectedPaise: 0,
          ticketRevenuePaise: 0,
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
          totalTicketsIssued: 0,
          paidTickets: 0,
          freeRsvpTickets: 0,
          paidOrderCount: 0,
          guestGrossCollectedPaise: 0,
          ticketRevenuePaise: 0,
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

  it('does not expose a counterparty organization id when its display name is unavailable', () => {
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

    expect(data.network[0]?.name).toBe('Partner name unavailable');
    expect(data.network[0]?.name).not.toContain('org_counterparty_long_id');
    expect(data.network[0]?.initials).toBe('H');
    expect(data.network[0]?.role).toBe('Host');
  });
});
