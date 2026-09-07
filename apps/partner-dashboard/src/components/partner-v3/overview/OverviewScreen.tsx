
import Image from 'next/image';
import Link from 'next/link';

import {
  AddIcon,
  BankIcon,
  BottleServiceIcon,
  ExpandIcon,
  ForwardIcon,
  RefundIcon,
  TicketIcon,
  UsersIcon,
} from '@c1rcle/icons';

import styles from './overview.module.css';
import { OverviewTrendCard } from './OverviewTrendCard';

import type { OverviewAccent, OverviewActivity, OverviewData, OverviewLinks } from '@/data/partner-data-source';
import type { ComponentType } from 'react';

const activityIcons: Readonly<Record<OverviewActivity['kind'], ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>>> = {
  ticket: TicketIcon,
  payout: BankIcon,
  refund: RefundIcon,
  table: BottleServiceIcon,
};

const activityToneClasses = {
  positive: { icon: styles['activityIcon-positive'], amount: styles['amount-positive'] },
  neutral: { icon: styles['activityIcon-neutral'], amount: styles['amount-neutral'] },
  negative: { icon: styles['activityIcon-negative'], amount: styles['amount-negative'] },
} as const;

const upcomingBackgroundClasses = [
  styles['upcomingEvent-1'],
  styles['upcomingEvent-2'],
  styles['upcomingEvent-3'],
  styles['upcomingEvent-4'],
] as const;

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

const classNames = (...names: readonly (string | undefined | false)[]) => names.filter(Boolean).join(' ');

function SectionHeader({ id, title, description, href, action }: { readonly id: string; readonly title: string; readonly description?: string; readonly href?: string; readonly action?: string }) {
  return (
    <header className={styles['sectionHeader']}>
      <div>
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {href && action ? <Link href={href}>{action}<ForwardIcon size={13} aria-hidden="true" /></Link> : null}
    </header>
  );
}

export function OverviewScreen({ data, links, accent = 'orange' }: { readonly data: OverviewData; readonly links: OverviewLinks; readonly accent?: OverviewAccent }) {
  const soldPercent = Math.round((data.nextEvent.sold / data.nextEvent.capacity) * 100);
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={[styles['overview'], accent === 'lavender' ? styles['accentLavender'] : ''].filter(Boolean).join(' ')}>
      <header className={styles['pageHeader']}>
        <div>
          <div className={styles['dateLine']}><span>{data.todayLabel}</span><span className={styles['fixtureTag']}>Fixture data</span></div>
          <h1>{data.greeting}</h1>
        </div>
        <Link className={styles['createLink']} href={links.createEvent}><AddIcon size={16} aria-hidden="true" />Create event</Link>
      </header>

      <div className={styles['primaryGrid']}>
        <div className={styles['primaryStack']}>
          <article className={styles['hero']} aria-labelledby="next-event-title">
            {data.nextEvent.imageSrc ? (
              <Image src={data.nextEvent.imageSrc} alt={data.nextEvent.imageAlt ?? ''} fill priority sizes="(max-width: 900px) 100vw, 52vw" />
            ) : null}
            <div className={styles['heroOverlay']} aria-hidden="true" />
            <div className={styles['heroContent']}>
              <div className={styles['heroTopline']}>
                <span className={styles['livePill']}><i aria-hidden="true" />{data.nextEvent.dateLabel} · {data.nextEvent.timeLabel}</span>
                <span>{data.nextEvent.doorsLabel}</span>
              </div>
              <div className={styles['heroDetails']}>
                <p>{data.nextEvent.venue}</p>
                <h2 id="next-event-title">{data.nextEvent.name}</h2>
                <div className={styles['capacityLabels']}>
                  <span>{data.nextEvent.sold.toLocaleString('en-IN')} of {data.nextEvent.capacity.toLocaleString('en-IN')} tickets sold</span>
                  <strong>{soldPercent}% full</strong>
                </div>
                <progress className={styles['progressTrack']} aria-label={String(soldPercent) + '% of tickets sold'} value={soldPercent} max={100} />
                <Link className={styles['heroAction']} href={`${data.nextEvent.href}/guests`}><UsersIcon size={18} aria-hidden="true" />View guest list</Link>
              </div>
            </div>
          </article>
          <OverviewTrendCard series={data.trends} />
        </div>

        <section className={classNames(styles['card'], styles['activityCard'])} aria-labelledby="recent-activity-title">
          <SectionHeader id="recent-activity-title" title="Recent activity" description="Orders, payouts & refunds" href={links.finance} action="View all" />
          <div className={styles['activityList']}>
            {data.recentActivity.map((activity) => {
              const Icon = activityIcons[activity.kind];
              return (
                <div className={styles['activityRow']} key={activity.id}>
                  <span className={classNames(styles['activityIcon'], activityToneClasses[activity.tone].icon)}><Icon size={17} aria-hidden="true" /></span>
                  <div><strong>{activity.name}</strong><span>{activity.meta}</span></div>
                  <b className={activityToneClasses[activity.tone].amount}>{activity.amount}</b>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className={styles['secondaryGrid']}>
        <section className={classNames(styles['card'], styles['calendarCard'])} aria-labelledby="calendar-title">
          <div className={styles['calendarHeader']}>
            <h2 id="calendar-title">{data.calendar.monthLabel}</h2>
            <Link href={links.calendar}><span>See all events</span><i><ExpandIcon size={14} aria-hidden="true" /></i></Link>
          </div>
          <div className={styles['calendarWeekdays']} aria-hidden="true">{weekdays.map((day, index) => <span key={[day, String(index)].join('-')}>{day}</span>)}</div>
          <div className={styles['calendarGrid']}>
            {Array.from({ length: data.calendar.firstDayOffset }, (_, index) => <span key={['empty', String(index)].join('-')} aria-hidden="true" />)}
            {data.calendar.days.map((day) => {
              const eventLabel = day.eventCount ? [String(day.eventCount), day.eventCount > 1 ? 'events' : 'event'].join(' ') : '';
              const ariaLabel = [data.calendar.monthLabel, String(day.day), eventLabel, day.isToday ? 'today' : ''].filter(Boolean).join(', ');
              return <span key={day.day} className={classNames(day.eventCount ? styles['eventDay'] : false, day.isToday ? styles['today'] : false)} aria-label={ariaLabel}>{day.day}</span>;
            })}
          </div>
        </section>

        <section className={classNames(styles['card'], styles['upcomingCard'])} aria-labelledby="upcoming-title">
          <SectionHeader id="upcoming-title" title="Upcoming events" href={links.events} action="See all" />
          <div className={styles['upcomingList']}>
            {data.upcomingEvents.map((event, index) => {
              const percent = Math.round((event.sold / event.capacity) * 100);
              return (
                <Link className={classNames(styles['upcomingEvent'], upcomingBackgroundClasses[index])} href={event.href} key={event.id}>
                  <div><strong>{event.name}</strong><span>{event.venue} · {event.dateLabel}</span></div>
                  <b className={eventStatusClasses[event.status]}>{percent}%<small>sold</small></b>
                </Link>
              );
            })}
          </div>
        </section>

        <section className={classNames(styles['card'], styles['networkCard'])} aria-labelledby="network-title">
          <SectionHeader id="network-title" title="My network" description="Venues, hosts & promoters" href={links.partners} action="See all" />
          <div className={styles['networkList']}>
            {data.network.map((member) => (
              <div className={styles['networkRow']} key={member.id}>
                <span className={classNames(styles['networkAvatar'], networkAccentClasses[member.accent])}>{member.initials}</span>
                <div><strong>{member.name}</strong><span>{member.role}</span></div>
                <b className={networkStatusClasses[member.statusTone]}>{member.status}</b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
