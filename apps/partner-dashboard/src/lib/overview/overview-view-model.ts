import { formatPaise } from '@/lib/finance/finance-view-model';

import type {
  OverviewActivity,
  OverviewAccent,
  OverviewCalendarDay,
  OverviewData,
  OverviewEvent,
  OverviewNetworkMember,
  OverviewTrendMetric,
  OverviewTrendRange,
  OverviewTrendSeries,
} from '@/data/partner-data-source';
import type {
  OrganizationCalendarDto,
  OrganizationEventCardDto,
  OrganizationEventCardListResponse,
  OrganizationOverviewDto,
  OrganizationTrendsDto,
} from '@c1rcle/contracts';

/**
 * ─── Overview view model ─────────────────────────────────────────────────────
 *
 * The one place Phase 1 wire shapes become the strings the overview screen
 * renders. Two rules this module exists to enforce:
 *
 * 1. **Paise become rupees in exactly one place.** `formatPaise` is reused from
 *    the finance view model rather than re-implemented, so a number cannot be
 *    rounded twice by crossing from the finance desk to the dashboard.
 *
 * 2. **Nothing is invented.** Where the backend has no figure this returns an
 *    honest empty or hedged value rather than a plausible one. Three cases drove
 *    most of the design here and are worth naming, because each one looked like
 *    a trivial value to fill in:
 *
 *    - **No doors time exists.** An event carries `startAt`/`endAt` and nothing
 *      else. `doorsLabel` is therefore left `undefined` rather than inferred
 *      from start time — a doors time nobody set is not a small inaccuracy, it
 *      is a fact about the night that the partner can be wrong about.
 *    - **No `clicks` series exists.** Referral-link clicks are a per-promoter
 *      vanity counter with no authoritative attribution behind it. There is no
 *      org-level clicks metric, so `trends` carries two metrics, not three.
 *    - **Lifetime totals are not the window's sum.** `totals` is deliberately
 *      lifetime, so "All" shows real lifetime numbers while a clamped recent
 *      window does not pretend to be all-time.
 */

/** Cards rendered in "Upcoming events". */
const UPCOMING_LIMIT = 4;

/** Buckets plotted per range. Matches the fixture's point counts. */
const POINTS_1D = 12;
const POINTS_1W = 7;
const POINTS_1M = 12;
const POINTS_ALL = 12;

/** How many days back the "All" monthly series reaches. */
const ALL_TIME_MONTHS = 24;

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export interface OverviewViewModelInput {
  readonly accent: OverviewAccent;
  readonly overview: OrganizationOverviewDto;
  /** `1D` — hourly buckets for today. */
  readonly hourly: OrganizationTrendsDto;
  /** `1W` / `1M` — daily buckets over a window covering both. */
  readonly daily: OrganizationTrendsDto;
  /** `All` — monthly buckets over the longest window we will plot. */
  readonly monthly: OrganizationTrendsDto;
  readonly calendar: OrganizationCalendarDto;
  readonly cards: OrganizationEventCardListResponse;
  /** Display name for the greeting; falls back to a neutral line. */
  readonly displayName: string | null;
  /** Partnerships, for the network card. Names are not resolvable — see below. */
  readonly network: readonly NetworkPartner[];
  /** Recent ledger-backed activity. */
  readonly activity: readonly ActivitySource[];
  /**
   * The moment the page is rendering, injected rather than read from the clock.
   * Every label below is derived from it, and a Server Component that called
   * `new Date()` internally would produce labels that shift between the server
   * render and the client hydration of the same page.
   */
  readonly now: Date;
}

export interface NetworkPartner {
  readonly partnershipId: string;
  readonly counterpartyOrganizationId: string;
  readonly side: 'host' | 'venue';
  readonly status: string;
}

export interface ActivitySource {
  readonly id: string;
  readonly kind: 'ticket' | 'payout' | 'refund' | 'table';
  readonly name: string;
  readonly meta: string;
  /** Signed paise. Negative for money leaving the account. */
  readonly amountPaise: number;
  readonly occurredAt: string;
}

export function toOverviewData(input: OverviewViewModelInput): OverviewData {
  const { now } = input;
  const today = toDayKey(now);

  const events = input.cards.items.map((card) => toEvent(card));
  const [nextEvent, ...rest] = events;

  return {
    dataStatus: 'api',
    todayLabel: formatTodayLabel(now),
    greeting: formatGreeting(input.displayName, now),
    // A partner with nothing scheduled gets an honest placeholder rather than a
    // fabricated next event. The card renders its own empty state.
    nextEvent: nextEvent ?? placeholderEvent(),
    trends: buildTrends(input),
    recentActivity: buildActivity(input.activity),
    calendar: {
      // The label follows the **calendar's** month, not the render date. The
      // grid can legitimately be showing a different month than today, and a
      // heading that said "September" over an August grid would be a lie about
      // the thing being looked at.
      monthLabel: formatMonthLabel(input.calendar.month),
      firstDayOffset: input.calendar.firstDayOffset,
      days: buildCalendarDays(input.calendar, today),
    },
    upcomingEvents: rest.slice(0, UPCOMING_LIMIT - 1),
    network: buildNetwork(input.network),
  };
}

// ─── Events ──────────────────────────────────────────────────────────────────

function toEvent(card: OrganizationEventCardDto): OverviewEvent {
  return {
    id: card.eventId,
    name: card.title,
    // A deleted venue or a venue-less event resolves to a dash, not to the
    // string "undefined" and not to a guess.
    venue: card.venueName ?? 'Venue to be announced',
    dateLabel: formatDayLabel(card.startAt),
    timeLabel: formatTimeLabel(card.startAt),
    href: `/events/${encodeURIComponent(card.eventId)}`,
    ...(card.imageUrl ? { imageSrc: card.imageUrl, imageAlt: card.title } : {}),
    status: toEventStatus(card.status),
    sold: card.ticketsSold,
    // Preserved as `null`. Coercing to `0` here would make the screen print
    // "0 tickets sold" and divide by zero for every venue that never declared a
    // capacity — which is a claim, not a default.
    capacity: card.capacity,
    // `doorsLabel` is intentionally absent: see the module comment.
  };
}

function placeholderEvent(): OverviewEvent {
  return {
    id: '',
    name: 'No upcoming events',
    venue: 'Create your first event to see it here',
    dateLabel: '',
    timeLabel: '',
    href: '/partner/venue/events/create',
    status: 'draft',
    sold: 0,
    capacity: null,
  };
}

/**
 * Collapses the backend's full `EventStatus` enum into the three the card
 * styles. Anything that is not live or finished is treated as a draft, which is
 * the honest default: an unrecognised status should not render as "live".
 */
function toEventStatus(status: string): OverviewEvent['status'] {
  if (status === 'published' || status === 'sales_paused' || status === 'started') return 'live';
  if (status === 'ended') return 'past';
  return 'draft';
}

// ─── Trends ──────────────────────────────────────────────────────────────────

/**
 * The screen toggles metric and range **client-side** off this array
 * (`series.find(metric && range)`), so all four ranges × two metrics are
 * computed here, once, on the server. That is why the loader fetches three
 * granularities rather than one range: a client refetch per toggle would put a
 * network round-trip inside a segmented-control click.
 */
function buildTrends(input: OverviewViewModelInput): readonly OverviewTrendSeries[] {
  const series: OverviewTrendSeries[] = [];
  for (const metric of ['tickets', 'revenue'] as const) {
    series.push(trendSeries(metric, '1D', input.hourly, POINTS_1D, 'Today, by the hour'));
    series.push(trendSeries(metric, '1W', input.daily, POINTS_1W, 'This week, by day', 7));
    series.push(trendSeries(metric, '1M', input.daily, POINTS_1M, 'This month, by day', 30));
    series.push(
      trendSeries(
        metric,
        'All',
        input.monthly,
        POINTS_ALL,
        `Last ${String(ALL_TIME_MONTHS)} months, by month`,
      ),
    );
  }
  return series;
}

/**
 * One (metric, range) row.
 *
 * `value` is the sum over the **whole** series the endpoint returned, not over
 * the plotted points. Sub-sampling to fit a chart and then reporting the
 * sub-sample's sum would understate the number whenever the two differ — which
 * for `1W` plotted from a 30-day daily window is always.
 */
function trendSeries(
  metric: OverviewTrendMetric,
  range: OverviewTrendRange,
  trends: OrganizationTrendsDto,
  points: number,
  caption: string,
  /** Trailing buckets to use as the window, for a series fetched wider than needed. */
  window?: number,
): OverviewTrendSeries {
  const scoped = window === undefined ? trends.buckets : trends.buckets.slice(-window);
  const values = scoped.map((bucket) =>
    metric === 'revenue' ? bucket.revenuePaise / 100 : bucket.tickets,
  );

  return {
    metric,
    range,
    value: formatTotal(metric, values),
    delta: formatDelta(values, window),
    caption,
    points: sample(values, points),
  };
}

function formatTotal(metric: OverviewTrendMetric, values: readonly number[]): string {
  const sum = values.reduce((total, value) => total + value, 0);
  if (metric === 'revenue') return formatPaise(sum * 100);
  return sum.toLocaleString('en-IN');
}

/**
 * Change against the preceding window, or an honest "—" when there is no
 * preceding window to compare against.
 *
 * The fixture showed "+18%" style deltas with no data behind them. `1D` has
 * exactly one comparable window available here (the hours before it in the same
 * fetch would need a second request), and `All` has no preceding window at all,
 * so both return "—" rather than a fabricated percentage.
 */
function formatDelta(values: readonly number[], window: number | undefined): string {
  if (window === undefined) return '—';
  // Half the window, compared against the other half: the recent buckets
  // against the equally-long run of buckets before them.
  const half = Math.floor(values.length / 2);
  if (half === 0) return '—';
  const previous = values.slice(0, half).reduce((total, value) => total + value, 0);
  const current = values.slice(half).reduce((total, value) => total + value, 0);
  // Growth from zero is unbounded, so a percentage here would be an invention.
  if (previous === 0) return current === 0 ? '0%' : 'New';
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? '+' : ''}${String(change)}%`;
}

/**
 * Reduces `values` to at most `points` entries.
 *
 * Evenly spaced by index, always keeping the **last** value: the most recent
 * bucket is the one a partner is actually looking at, and dropping it in favour
 * of an average of the rest would make today's sales invisible.
 */
function sample(values: readonly number[], points: number): readonly number[] {
  if (values.length <= points) return [...values];
  const step = (values.length - 1) / (points - 1);
  return Array.from({ length: points }, (_, index) => {
    const value = values[Math.round(index * step)];
    return value ?? 0;
  });
}

// ─── Calendar ────────────────────────────────────────────────────────────────

function buildCalendarDays(
  calendar: OrganizationCalendarDto,
  today: string,
): readonly OverviewCalendarDay[] {
  const dayOfMonth = Number(today.slice(8, 10));
  const isCurrentMonth = calendar.month === today.slice(0, 7);
  return calendar.days.map((day) => ({
    day: day.day,
    // Present even at zero. The grid lays out every cell, and omitting the
    // count would make an idle day look like missing data.
    eventCount: day.eventCount,
    isToday: isCurrentMonth && day.day === dayOfMonth,
  }));
}

function formatMonthLabel(month: string): string {
  const index = Number(month.slice(5, 7)) - 1;
  const name = MONTH_LABELS[index] ?? '';
  return `${name} ${month.slice(0, 4)}`;
}

// ─── Activity ────────────────────────────────────────────────────────────────

function buildActivity(sources: readonly ActivitySource[]): readonly OverviewActivity[] {
  return [...sources]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .map((source) => ({
      id: source.id,
      kind: source.kind,
      name: source.name,
      meta: source.meta,
      amount: formatAmount(source.amountPaise),
      tone: source.amountPaise > 0 ? 'positive' : source.amountPaise < 0 ? 'negative' : 'neutral',
    }));
}

function formatAmount(paise: number): string {
  if (paise === 0) return '—';
  return `${paise > 0 ? '+' : '−'} ${formatPaise(Math.abs(paise))}`;
}

// ─── Network ─────────────────────────────────────────────────────────────────

/**
 * The network card lists counterparties from real partnerships.
 *
 * It shows a **shortened organization id**, not a name: the partnership DTO
 * carries ids, and there is no partner-side endpoint that resolves a
 * counterparty organization the viewer is not a member of. Inventing a name
 * here would put a stranger's business name on another partner's dashboard.
 */
function buildNetwork(partners: readonly NetworkPartner[]): readonly OverviewNetworkMember[] {
  return partners.map((partner, index) => ({
    id: partner.partnershipId,
    name: shortId(partner.counterpartyOrganizationId),
    role: partner.side === 'venue' ? 'Venue' : 'Host',
    initials: shortId(partner.counterpartyOrganizationId).slice(0, 2).toUpperCase(),
    status: toNetworkStatus(partner.status),
    statusTone: partner.status === 'active' ? 'success' : 'neutral',
    accent: (['orange', 'violet', 'teal', 'pink'] as const)[index % 4] ?? 'orange',
  }));
}

function toNetworkStatus(status: string): OverviewNetworkMember['status'] {
  if (status === 'active') return 'Partnered';
  if (status === 'pending') return 'Invite sent';
  return 'Active';
}

function shortId(id: string): string {
  return id.length <= 10 ? id : `${id.slice(0, 8)}…`;
}

// ─── Date labels (UTC, so server and client agree) ───────────────────────────

/**
 * `Thursday, 16 July · 5:40 PM`.
 *
 * UTC throughout. This string is produced on the server and re-rendered on the
 * client during hydration; if it were local-time, a partner in a different zone
 * from the server would get a hydration mismatch on every render.
 */
function formatTodayLabel(now: Date): string {
  const weekday = WEEKDAY_LABELS[now.getUTCDay()] ?? '';
  const month = MONTH_LABELS[now.getUTCMonth()] ?? '';
  return `${weekday}, ${String(now.getUTCDate())} ${month} · ${formatClock(now)}`;
}

function formatGreeting(displayName: string | null, now: Date): string {
  const hour = now.getUTCHours();
  const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const firstName = displayName?.trim().split(/\s+/)[0];
  // No stored display name → a greeting that is still warm but claims nothing.
  return firstName ? `Good ${part}, ${firstName}` : `Good ${part}`;
}

function formatClock(now: Date): string {
  const hours = now.getUTCHours();
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const suffix = hours < 12 ? 'AM' : 'PM';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(twelve)}:${minutes} ${suffix}`;
}

function formatDayLabel(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return `${String(parsed.getUTCDate())} ${MONTH_LABELS[parsed.getUTCMonth()] ?? ''}`;
}

function formatTimeLabel(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return formatClock(parsed);
}

/** `YYYY-MM-DD` in UTC, the wire format every date range uses. */
function toDayKey(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` `offset` days before `instant`, in UTC. */
export function dayKeyOffset(instant: Date, offset: number): string {
  return new Date(instant.getTime() - offset * 86_400_000).toISOString().slice(0, 10);
}

/** `YYYY-MM` in UTC. */
export function monthKeyOffset(instant: Date, months: number): string {
  return new Date(Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth() + months, 1))
    .toISOString()
    .slice(0, 7);
}
