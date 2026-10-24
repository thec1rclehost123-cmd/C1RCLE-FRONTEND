import Image from 'next/image';
import Link from 'next/link';

import { AddIcon, ForwardIcon, TicketIcon, UsersIcon } from '@c1rcle/icons';

import { FixtureBadge } from '../FixtureBadge';

import styles from './overview.module.css';
import { OverviewCalendarCard } from './OverviewCalendarCard';
import { OverviewTrendCard } from './OverviewTrendCard';

import type { OverviewAccent, OverviewData, OverviewLinks } from '@/data/partner-data-source';

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

export function OverviewScreen({
  data,
  links,
  accent = 'orange',
  studio,
  organizationId,
}: {
  readonly data: OverviewData;
  readonly links: OverviewLinks;
  readonly accent?: OverviewAccent;
  readonly studio?: 'venue' | 'host';
  readonly organizationId?: string | null;
}) {
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
            {data.nextEvent.imageSrc ? (
              <Image
                src={data.nextEvent.imageSrc}
                alt={data.nextEvent.imageAlt ?? ''}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 52vw"
              />
            ) : null}
            <div className={styles['heroOverlay']} aria-hidden="true" />
            <div className={styles['heroContent']}>
              <div className={styles['heroTopline']}>
                <span className={styles['livePill']}>
                  <i aria-hidden="true" />
                  {data.nextEvent.dateLabel} · {data.nextEvent.timeLabel}
                </span>
                {/* The backend has no doors-time field, so the API-backed path
                    never supplies one. Rendering an empty span would leave a
                    stray gap in the topline; inventing one (e.g. an hour before
                    start) would print a time no partner ever set. */}
                {data.nextEvent.doorsLabel ? <span>{data.nextEvent.doorsLabel}</span> : null}
              </div>
              <div className={styles['heroDetails']}>
                <p>{data.nextEvent.venue}</p>
                <h2 id="next-event-title">{data.nextEvent.name}</h2>
                <div className={styles['capacityLabels']}>
                  {/* `null` capacity means the venue never declared one. Showing
                      "0 tickets" would be a different claim, and the percentage
                      has no denominator, so the sell-through is simply omitted. */}
                  {data.nextEvent.capacity === null ? (
                    <span>{data.nextEvent.sold.toLocaleString('en-IN')} tickets sold</span>
                  ) : (
                    <>
                      <span>
                        {data.nextEvent.sold.toLocaleString('en-IN')} of{' '}
                        {data.nextEvent.capacity.toLocaleString('en-IN')} tickets sold
                      </span>
                      <strong>{soldPercentOf(data.nextEvent)}% full</strong>
                    </>
                  )}
                </div>
                {data.nextEvent.capacity === null ? null : (
                  <progress
                    className={styles['progressTrack']}
                    aria-label={String(soldPercentOf(data.nextEvent)) + '% of tickets sold'}
                    value={soldPercentOf(data.nextEvent)}
                    max={100}
                  />
                )}
                {data.nextEvent.id ? (
                  <Link
                    className={styles['heroAction']}
                    href={`/partner/${studio ?? 'venue'}/events/${encodeURIComponent(data.nextEvent.id)}/guests`}
                  >
                    <UsersIcon size={18} aria-hidden="true" />
                    View guest list
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
          <OverviewTrendCard series={data.trends} />
        </div>

        <section
          className={classNames(styles['card'], styles['activityCard'])}
          aria-labelledby="recent-orders-title"
        >
          <SectionHeader
            id="recent-orders-title"
            title="Recent orders"
            description="Latest Guest orders across your events"
            href={links.finance}
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
                <div className={styles['activityRow']} key={order.id}>
                  <span
                    className={classNames(styles['activityIcon'], styles['activityIcon-positive'])}
                  >
                    <TicketIcon size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{order.eventName}</strong>
                    <span>
                      {order.ticketCount} {order.ticketCount === 1 ? 'ticket' : 'tickets'} ·{' '}
                      {order.statusLabel} · {order.placedAtLabel} IST
                    </span>
                  </div>
                  <b>{order.amountLabel}</b>
                </div>
              );
            })}
            <p className={styles['overviewEmpty']}>
              Guest totals can include platform fees and GST; they are not Partner payable.
              Payout/refund activity is not connected here.
            </p>
          </div>
        </section>
      </div>

      <div className={styles['secondaryGrid']}>
        <OverviewCalendarCard
          fallback={data.calendar}
          href={links.calendar}
          {...(studio ? { studio } : {})}
          {...(organizationId !== undefined ? { organizationId } : {})}
        />

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
            {data.upcomingEvents.map((event, index) => {
              const percent = soldPercentOf(event);
              return (
                <Link
                  className={classNames(styles['upcomingEvent'], upcomingBackgroundClasses[index])}
                  href={event.href}
                  key={event.id}
                >
                  <div>
                    <strong>{event.name}</strong>
                    <span>
                      {event.venue} · {event.dateLabel}
                    </span>
                  </div>
                  {/* No declared capacity → no percentage, rather than a
                      divide-by-zero dressed up as "0% sold". */}
                  <b className={eventStatusClasses[event.status]}>
                    {event.capacity === null ? (
                      <small>sold</small>
                    ) : (
                      <>
                        {percent}%<small>sold</small>
                      </>
                    )}
                  </b>
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
            {data.network.length === 0 ? (
              <p className={styles['overviewEmpty']}>No partner relationships yet.</p>
            ) : null}
            {data.network.slice(0, NETWORK_PREVIEW_LIMIT).map((member) => (
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
