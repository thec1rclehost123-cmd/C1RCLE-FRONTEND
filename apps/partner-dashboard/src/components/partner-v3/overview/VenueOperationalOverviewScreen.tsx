import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import { formatProductDateTime } from '@/lib/events/event-time';
import {
  formatDayLabel,
  formatGreeting,
  formatTimeLabel,
  formatTodayLabel,
} from '@/lib/overview/overview-view-model';

import styles from './overview.module.css';
import { OverviewScreen, type VenueOverviewPresentation } from './OverviewScreen';
import venueStyles from './venue-operational-overview.module.css';

import type {
  VenueOperationalAnalyticsDto,
  VenueOperationalEventDto,
  VenueOperationalOverviewDto,
} from '@c1rcle/contracts';

const numberFormat = new Intl.NumberFormat('en-IN');
const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: PRODUCT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const venuePath = '/partner/venue';
const summaryItems = [
  ['Events tonight', 'eventsTonight'],
  ['Upcoming events', 'upcomingEvents'],
  ['Ticket units', 'ticketUnitsIssued'],
  ['RSVP units', 'rsvpUnitsIssued'],
  ['Expected guests', 'expectedGuests'],
  ['Checked in', 'checkedInGuests'],
] as const;

function eventHref(event: VenueOperationalEventDto) {
  return `${venuePath}/events/${encodeURIComponent(event.id)}`;
}

function organizerLabel(event: VenueOperationalEventDto) {
  return event.ownerType === 'venue'
    ? `Organized by ${event.venueName}`
    : event.hostName
      ? `Hosted by ${event.hostName}`
      : 'Host event';
}

function calendarPreview(
  today: string,
  analytics: VenueOperationalAnalyticsDto | null,
  events: readonly VenueOperationalEventDto[],
) {
  const month = today.slice(0, 7);
  const start = new Date(`${month}-01T00:00:00Z`);
  const days = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const counts = new Map(
    analytics?.days
      .filter((day) => day.date.startsWith(month))
      .map((day) => [day.date, day.eventCount]),
  );
  const listedCounts = new Map<string, number>();
  for (const event of events) {
    const date = dayKeyFormat.format(new Date(event.startAt));
    if (date.startsWith(month)) listedCounts.set(date, (listedCounts.get(date) ?? 0) + 1);
  }
  return {
    monthLabel: formatProductDateTime(start.toISOString(), { month: 'long', year: 'numeric' }),
    firstDayOffset: start.getUTCDay(),
    days: Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const date = `${month}-${String(day).padStart(2, '0')}`;
      return {
        day,
        eventCount: Math.max(counts.get(date) ?? 0, listedCounts.get(date) ?? 0),
        isToday: date === today,
      };
    }),
  };
}

export function VenueOperationalOverviewScreen({
  data,
  analytics,
  now,
  network = null,
}: {
  readonly data: VenueOperationalOverviewDto;
  readonly analytics: VenueOperationalAnalyticsDto | null;
  readonly now: Date;
  readonly network?: VenueOverviewPresentation['network'];
}) {
  const { summary } = data;
  const today = dayKeyFormat.format(now);
  const liveEvents =
    analytics?.events.filter(
      (event) =>
        event.status === 'started' &&
        (event.endAt === null || Date.parse(event.endAt) > now.getTime()),
    ) ?? [];
  const upcoming = [
    ...new Map([...liveEvents, ...data.upcomingEvents].map((event) => [event.id, event])).values(),
  ].sort((a, b) => a.startAt.localeCompare(b.startAt));
  const featured = upcoming[0];
  const trendDays = analytics?.days.filter((day) => day.date <= today).slice(-7) ?? [];
  const trendTotal = trendDays.reduce((total, day) => total + day.ticketUnitsIssued, 0);
  const missingCapacity = upcoming.some((event) => event.venueCapacity === null);
  const capacity = summary.physicalVenueCapacity;
  const occupancy = summary.expectedOccupancyPercent;

  function toEvent(event: VenueOperationalEventDto): VenueOverviewPresentation['nextEvent'] {
    return {
      id: event.id,
      name: event.title,
      venue: organizerLabel(event),
      dateLabel: formatDayLabel(event.startAt),
      timeLabel: formatTimeLabel(event.startAt),
      href: eventHref(event),
      status: 'live',
      ...(event.imageUrl ? { imageSrc: event.imageUrl } : {}),
      doorsLabel:
        event.status === 'started'
          ? 'Live now'
          : event.status === 'sales_paused'
            ? 'Sales paused'
            : 'Next event',
      expectedGuestsLabel: `${event.operationalCountsComplete ? '' : 'At least '}${numberFormat.format(event.expectedGuests)} expected guests`,
    };
  }
  const nextEvent = featured
    ? toEvent(featured)
    : {
        id: '',
        name: 'No upcoming events',
        venue:
          summary.complete && analytics
            ? 'Your Venue schedule is clear'
            : 'No upcoming events are currently available to display',
        dateLabel: '',
        timeLabel: '',
        href: `${venuePath}/events`,
        status: 'draft' as const,
      };

  return (
    <OverviewScreen
      data={{
        dataStatus: 'api',
        todayLabel: formatTodayLabel(now),
        greeting: formatGreeting(null, now),
        nextEvent,
        trends: trendDays.length
          ? [
              {
                metric: 'tickets',
                range: '1W',
                value: `${analytics?.summary.complete ? '' : 'At least '}${numberFormat.format(trendTotal)}`,
                delta: '',
                caption: 'Ticket units for events in the last 7 days',
                points: trendDays.map((day) => day.ticketUnitsIssued),
                pointLabels: trendDays.map((day) =>
                  formatProductDateTime(`${day.date}T00:00:00Z`, {
                    day: 'numeric',
                    month: 'short',
                  }),
                ),
              },
            ]
          : [],
        calendar: calendarPreview(today, analytics, upcoming),
        calendarComplete: analytics?.summary.complete === true,
        upcomingEvents: upcoming.map(toEvent),
        network,
        venueOperations: (
          <>
            {!summary.complete ? (
              <p className={styles['overviewEmpty']} role="status">
                Some counts are incomplete. Totals show the minimum recorded so far.
              </p>
            ) : null}
            <dl className={venueStyles['metrics']}>
              {summaryItems.map(([label, key]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>
                    {!summary.complete ? '≥ ' : ''}
                    {numberFormat.format(summary[key])}
                  </dd>
                </div>
              ))}
              <div>
                <dt>Physical Venue capacity</dt>
                <dd>
                  {capacity === 0
                    ? 'Unknown'
                    : `${missingCapacity || !summary.complete ? '≥ ' : ''}${numberFormat.format(capacity)}`}
                </dd>
              </div>
              <div>
                <dt>Expected capacity use</dt>
                <dd>
                  {occupancy === null || capacity === 0 || missingCapacity || !summary.complete
                    ? 'Not available'
                    : `${numberFormat.format(occupancy)}%`}
                </dd>
              </div>
            </dl>
          </>
        ),
      }}
      links={{
        createEvent: `${venuePath}/events/create`,
        events: `${venuePath}/events`,
        calendar: `${venuePath}/calendar`,
        partners: `${venuePath}/partners`,
      }}
    />
  );
}
