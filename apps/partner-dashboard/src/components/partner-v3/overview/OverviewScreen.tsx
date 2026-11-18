import Link from 'next/link';

import { AddIcon, ForwardIcon, TicketIcon, UsersIcon } from '@c1rcle/icons';

import { isProductCalendarDay } from '@/lib/events/event-time';

import { FixtureBadge } from '../FixtureBadge';

import styles from './overview.module.css';
import { OverviewCalendarCard } from './OverviewCalendarCard';
import { OverviewEventPoster } from './OverviewEventPoster';
import { OverviewTrendCard } from './OverviewTrendCard';

import type {
  OverviewAccent,
  OverviewData,
  OverviewEvent,
  OverviewLinks,
} from '@/data/partner-data-source';
import type { ReactNode } from 'react';

const upcomingBackgroundClasses = [
  styles['upcomingEvent-1'],
  styles['upcomingEvent-2'],
  styles['upcomingEvent-3'],
  styles['upcomingEvent-4'],
] as const;

/**
 * Sell-through percentage, or `0` when capacity is undeclared.
 *
 * The `0` is only ever *displayed* behind a `capacity === null` guard at both
 * call sites; it exists so the helper has a total return type. Callers that
 * render it without checking capacity would be showing a real divide-by-zero.
 */
function soldPercentOf(event: OverviewData['nextEvent']): number {
  if (event.capacity === null || event.capacity <= 0) return 0;
  return Math.round((event.sold / event.capacity) * 100);
}

const eventStatusClasses = {
  live: styles['eventStatus-live'],
  draft: styles['eventStatus-draft'],
  past: styles['eventStatus-past'],
} as const;

const networkAccentClasses = {
  orange: styles['networkAvatar-orange'],
  violet: styles['networkAvatar-violet'],
  teal: styles['networkAvatar-teal'],
  pink: styles['networkAvatar-pink'],
} as const;

const networkStatusClasses = {
  accent: styles['networkStatus-accent'],
  success: styles['networkStatus-success'],
  neutral: styles['networkStatus-neutral'],
} as const;

const NETWORK_PREVIEW_LIMIT = 4;

const classNames = (...names: readonly (string | undefined | false)[]) =>
  names.filter(Boolean).join(' ');

function SectionHeader({
  id,
  title,
  description,
  href,
  action,
}: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly href?: string;
  readonly action?: string;
}) {
  return (
    <header className={styles['sectionHeader']}>
      <div>
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {href && action ? (
        <Link href={href}>
          {action}
          <ForwardIcon size={13} aria-hidden="true" />
        </Link>
      ) : null}
    </header>
  );
}

type VenueOverviewEvent = Omit<OverviewEvent, 'sold' | 'capacity'> & {
  readonly expectedGuestsLabel?: string;
  readonly doorsLabel?: string;
};

export type VenueOverviewPresentation = Pick<
  OverviewData,
  'dataStatus' | 'todayLabel' | 'greeting' | 'trends' | 'calendar'
> & {
  readonly nextEvent: VenueOverviewEvent;
  readonly upcomingEvents: readonly VenueOverviewEvent[];
  readonly network: OverviewData['network'] | null;
  readonly venueOperations: ReactNode;
  readonly calendarComplete: boolean;
};

export function OverviewScreen({
  data,
  links,
  accent = 'orange',
  studio,
  organizationId,
}: {
  readonly data: OverviewData | VenueOverviewPresentation;
  readonly links: Omit<OverviewLinks, 'finance'> & { readonly finance?: string };
  readonly accent?: OverviewAccent;
  readonly studio?: 'venue' | 'host';
  readonly organizationId?: string | null;
}) {
  const { nextEvent } = data;
  const venue = 'venueOperations' in data ? data : null;
  const nextEventIsToday = isProductCalendarDay(nextEvent.startAt);

  return (
    <div
      className={[styles['overview'], accent === 'lavender' ? styles['accentLavender'] : '']
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles['pageHeader']}>
        <div>
          <div className={styles['dateLine']}>
            <span>{data.todayLabel}</span>
            {/* The badge follows `dataStatus`, so it can only ever describe what
                is actually on screen. When the screen is API-backed there is
                nothing to disclaim. */}
            <FixtureBadge dataStatus={data.dataStatus} />
          </div>
          <h1>{data.greeting}</h1>
        </div>
        <Link className={styles['createLink']} href={links.createEvent}>
          <AddIcon size={16} aria-hidden="true" />
          Create event
        </Link>
      </header>

      <div className={styles['primaryGrid']}>
        <div className={styles['primaryStack']}>
          <article className={styles['hero']} aria-labelledby="next-event-title">
            <OverviewEventPoster
              src={nextEvent.imageSrc}
              alt={nextEvent.imageAlt ?? ''}
              className={styles['heroPoster'] ?? ''}
              fallbackClassName={styles['heroPosterFallback'] ?? ''}
              sizes="(max-width: 900px) 100vw, 52vw"
            />
            <div className={styles['heroOverlay']} aria-hidden="true" />
            <div className={styles['heroContent']}>
              <div className={styles['heroTopline']}>
                {!venue || nextEvent.id ? (
                  <span className={styles['livePill']}>
                    <i aria-hidden="true" />
                    {nextEvent.dateLabel} · {nextEvent.timeLabel}
                  </span>
                ) : null}
                {/* The backend has no doors-time field, so the API-backed path
                    never supplies one. Rendering an empty span would leave a
                    stray gap in the topline; inventing one (e.g. an hour before
                    start) would print a time no partner ever set. */}
                {nextEvent.doorsLabel ? <span>{nextEvent.doorsLabel}</span> : null}
              </div>
              <div className={styles['heroDetails']}>
                <p>{nextEvent.venue}</p>
                <h2 id="next-event-title">{nextEvent.name}</h2>
                <div className={styles['heroSalesRow']}>
                  <div className={styles['capacityLabels']}>
                    {/* `null` capacity means the venue never declared one. Showing
                        "0 tickets" would be a different claim, and the percentage
                        has no denominator, so the sell-through is simply omitted. */}
                    {'expectedGuestsLabel' in nextEvent ? (
                      <span>{nextEvent.expectedGuestsLabel}</span>
                    ) : 'sold' in nextEvent ? (
                      nextEvent.capacity === null ? (
                        <span>{nextEvent.sold.toLocaleString('en-IN')} tickets sold</span>
                      ) : (
                        <>
                          <span>
                            {nextEvent.sold.toLocaleString('en-IN')} of{' '}
                            {nextEvent.capacity.toLocaleString('en-IN')} tickets sold
                          </span>
                          <strong>{soldPercentOf(nextEvent)}% full</strong>
                        </>
                      )
                    ) : null}
                  </div>
                  {nextEvent.id ? (
                    <Link
                      className={styles['heroAction']}
                      href={
                        venue
                          ? nextEvent.href
                          : nextEventIsToday
                            ? `/partner/${studio ?? 'venue'}/events/${encodeURIComponent(nextEvent.id)}/door`
                            : `/partner/${studio ?? 'venue'}/events/${encodeURIComponent(nextEvent.id)}/guests`
                      }
                    >
                      {venue ? (
                        'View event'
                      ) : nextEventIsToday ? (
                        <>Door mode</>
                      ) : (
                        <>
                          <UsersIcon size={18} aria-hidden="true" />
                          View guest list
                        </>
                      )}
                    </Link>
                  ) : null}
                </div>
                {'sold' in nextEvent && nextEvent.capacity !== null ? (
                  <progress
                    className={styles['progressTrack']}
                    aria-label={String(soldPercentOf(nextEvent)) + '% of tickets sold'}
                    value={soldPercentOf(nextEvent)}
                    max={100}
                  />
                ) : null}
              </div>
            </div>
          </article>
          {venue && data.trends.length === 0 ? (
            <section className={classNames(styles['card'], styles['trendCard'])}>
              <h2 className={styles['trendTitle']}>Performance</h2>
              <p className={styles['overviewEmpty']}>
                Venue performance is temporarily unavailable.
              </p>
            </section>
          ) : (
            <OverviewTrendCard
              series={data.trends}
              {...(venue ? { metricOptions: [], rangeOptions: [] } : {})}
            />
          )}
        </div>

        {'recentOrders' in data ? (
          <section
            className={classNames(styles['card'], styles['activityCard'])}
            aria-labelledby="recent-orders-title"
          >
            <SectionHeader
              id="recent-orders-title"
              title="Recent orders"
              description="Latest Guest orders across your events"
              {...(links.finance ? { href: links.finance } : {})}
              action="View all"
            />
            <div className={styles['activityList']}>
              {data.recentOrders === null ? (
                <p className={styles['overviewEmpty']}>
                  Order details are not available to this workspace role.
                </p>
              ) : null}
              {data.recentOrders?.length === 0 ? (
                <p className={styles['overviewEmpty']}>No orders have been recorded yet.</p>
              ) : null}
              {data.recentOrders?.map((order) => {
                return (
                  <div className={styles['activityRow']} data-order-card="true" key={order.id}>
                    <span
                      className={classNames(
                        styles['activityIcon'],
                        styles['activityIcon-positive'],
                      )}
                    >
                      <TicketIcon size={17} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{order.buyerName}</strong>
                      <span className={styles['activityMeta']}>
                        {order.ticketSummary} · {order.timeAgo}
                      </span>
                    </div>
                    <b
                      className={styles[`amount-${order.amountTone}`]}
                      data-tone={order.amountTone}
                    >
                      {order.amountLabel}
                    </b>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section
            className={classNames(styles['card'], styles['activityCard'])}
            aria-labelledby="venue-operations-title"
          >
            <SectionHeader
              id="venue-operations-title"
              title="Venue operations"
              href="/partner/venue/analytics"
              action="View analytics"
            />
            {data.venueOperations}
          </section>
        )}
      </div>

      <div className={styles['secondaryGrid']}>
        {venue ? (
          <div>
            <OverviewCalendarCard fallback={data.calendar} href={links.calendar} />
            {!venue.calendarComplete ? (
              <p className={styles['overviewEmpty']} role="status">
                The calendar preview may be incomplete.
              </p>
            ) : null}
          </div>
        ) : (
          <OverviewCalendarCard
            fallback={data.calendar}
            href={links.calendar}
            {...(studio ? { studio } : {})}
            {...(organizationId !== undefined ? { organizationId } : {})}
          />
        )}

        <section
          className={classNames(styles['card'], styles['upcomingCard'])}
          aria-labelledby="upcoming-title"
        >
          <SectionHeader
            id="upcoming-title"
            title="Upcoming events"
            href={links.events}
            action="See all"
          />
          <div className={styles['upcomingList']}>
            {venue && data.upcomingEvents.length === 0 ? (
              <p className={styles['overviewEmpty']}>No events to show.</p>
            ) : null}
            {data.upcomingEvents.map((event, index) => {
              return (
                <Link
                  className={classNames(
                    styles['upcomingEvent'],
                    upcomingBackgroundClasses[index],
                    Boolean(venue) && styles['venueUpcomingEvent'],
                  )}
                  href={event.href}
                  key={event.id}
                >
                  <OverviewEventPoster
                    src={event.imageSrc}
                    alt=""
                    className={styles['upcomingPoster'] ?? ''}
                    fallbackClassName={styles['upcomingPosterFallback'] ?? ''}
                    sizes="(max-width: 700px) 100vw, 360px"
                  />
                  <div>
                    <strong>{event.name}</strong>
                    <span>
                      {event.venue} · {event.dateLabel}
                    </span>
                  </div>
                  {/* Without a declared capacity, sell-through is unknown, so
                      don't imply that the event is sold or show a percentage. */}
                  {'sold' in event && event.capacity !== null ? (
                    <b className={eventStatusClasses[event.status]}>
                      <>
                        {soldPercentOf(event)}% <small>sold</small>
                      </>
                    </b>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>

        <section
          className={classNames(styles['card'], styles['networkCard'])}
          aria-labelledby="network-title"
        >
          <SectionHeader
            id="network-title"
            title="My network"
            description="Venues, hosts & promoters"
            href={links.partners}
            action="See all"
          />
          <div className={styles['networkList']}>
            {data.network === null ? (
              <p className={styles['overviewEmpty']}>
                Partner relationships are temporarily unavailable.
              </p>
            ) : null}
            {data.network?.length === 0 ? (
              <p className={styles['overviewEmpty']}>No partner relationships yet.</p>
            ) : null}
            {data.network?.slice(0, NETWORK_PREVIEW_LIMIT).map((member) => (
              <div className={styles['networkRow']} key={member.id}>
                <span
                  className={classNames(
                    styles['networkAvatar'],
                    networkAccentClasses[member.accent],
                  )}
                >
                  {member.initials}
                </span>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>
                <b className={networkStatusClasses[member.statusTone]}>{member.status}</b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
