import Link from 'next/link';

import { BankIcon, EmailIcon, LocationIcon, NextIcon, TicketIcon } from '@c1rcle/icons';

import { partnerRepositories } from '@/lib/partner/repositories';

import styles from '../host/HostOverviewScreen.module.css';

import type { IconProps } from '@c1rcle/icons';
import type { ComponentType } from 'react';

const className = (name: string): string => styles[name] ?? name;

const chartPath = (values: readonly number[]): string =>
  values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 650;
      const y = 182 - (value / 200) * 182;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

const chartPoint = (value: number, index: number, length: number): { x: number; y: number } => ({
  x: (index / Math.max(length - 1, 1)) * 650,
  y: 182 - (value / 200) * 182,
});

const activityIcons: Record<'order' | 'link' | 'payout', ComponentType<IconProps>> = {
  order: TicketIcon,
  link: EmailIcon,
  payout: BankIcon,
};

const initials = (name: string): string =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2);

export async function PromoterOverviewScreen() {
  const overview = await partnerRepositories.promoter.getOverview();
  const nextEvent = overview.nextEvent;
  const currentPerformance = overview.performance.slice(-7);
  const previousPerformance = overview.performance.slice(-14, -7);
  const currentTotal = currentPerformance.reduce((total, value) => total + value, 0);
  // The fixture supplies a 14-point series: previous seven days followed by
  // the current seven days. Keep the aggregate tied to the plotted period.
  const activity = [
    ...overview.recentOrders.slice(0, 2).map((order) => ({
      icon: 'order' as const,
      label: `${String(order.ticketCount)} ${order.ticketCount === 1 ? 'ticket' : 'tickets'} attributed for ${order.eventName}`,
      time: order.createdAt,
      href: '/promoter/finance/orders',
    })),
    ...overview.calendar
      .filter((item) => item.type === 'deadline')
      .slice(0, 2)
      .map((item) => ({
        icon: 'link' as const,
        label: item.label,
        time: item.date,
        href: '/promoter/events',
      })),
  ];
  const upcoming = overview.calendar.filter((item) => item.type === 'event').slice(0, 4);
  const linkedOrders = new Map(overview.recentOrders.map((order) => [order.eventName, order]));

  return (
    <div className={className('overview')}>
      <header className={className('pageHeader')}>
        <div>
          <h1>Good evening, {overview.profile.name.split(' ')[0] ?? 'promoter'}</h1>
          <p>Thursday, July 16</p>
        </div>
      </header>

      <div className={className('topGrid')}>
        {nextEvent ? (
          <section
            className={`${className('panel')} ${className('tonight')}`}
            aria-labelledby="promoter-event-title"
          >
            <div
              className={className('poster')}
              role="img"
              aria-label={`${nextEvent.name} artwork`}
            >
              <div className={className('posterCopy')} aria-hidden="true">
                <small>{nextEvent.date}</small>
                <strong>
                  {nextEvent.name.split(' ')[0]}
                  <br />
                  {nextEvent.name.split(' ').slice(1).join(' ')}
                </strong>
                <span>{nextEvent.category}</span>
              </div>
            </div>
            <div className={className('tonightBody')}>
              <div>
                <span className={className('eyebrow')}>
                  {nextEvent.status === 'active' ? 'Active' : 'Invitation'}
                </span>
                <h2 id="promoter-event-title">{nextEvent.name}</h2>
                <p className={className('venue')}>
                  <LocationIcon size={16} aria-hidden="true" />
                  {nextEvent.venue} · {nextEvent.city}
                </p>
              </div>
              <div className={className('tonightStats')}>
                <div className={className('doorTime')}>
                  <span>Event date</span>
                  <strong>{nextEvent.date}</strong>
                  <small>{nextEvent.time}</small>
                </div>
                <div className={className('capacity')}>
                  <span>Tickets moved</span>
                  <div>
                    <strong>{nextEvent.tickets}</strong>
                    <small> tickets</small>
                  </div>
                  <small>
                    {nextEvent.clicks.toLocaleString('en-IN')} clicks · {nextEvent.conversion}%
                    conversion
                  </small>
                </div>
              </div>
              <Link
                href={`/promoter/events/${nextEvent.id}`}
                className={className('openEventButton')}
              >
                Open event
              </Link>
            </div>
          </section>
        ) : (
          <section
            className={`${className('panel')} ${className('tonight')} ${className('empty')}`}
          >
            <div className={className('tonightBody')}>
              <span className={className('eyebrow')}>No linked event</span>
              <h2>Link an event to start tracking performance.</h2>
              <Link href="/promoter/events?view=discover" className={className('openEventButton')}>
                Discover events
              </Link>
            </div>
          </section>
        )}

        <section
          className={`${className('panel')} ${className('activity')}`}
          aria-labelledby="promoter-activity-title"
        >
          <div className={className('sectionHeading')}>
            <h2 id="promoter-activity-title">Recent activity</h2>
            <Link href="/promoter/events">View all</Link>
          </div>
          <div className={className('activityList')}>
            {activity.map((item) => {
              const ActivityIcon = activityIcons[item.icon];
              return (
                <Link
                  href={item.href}
                  key={`${item.label}-${item.time}`}
                  className={className('activityItem')}
                >
                  <span
                    className={`${className('activityIcon')} ${className(item.icon === 'order' ? 'accent' : 'warning')}`}
                  >
                    <ActivityIcon size={17} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className={className('activityCopy')}>
                    <strong>
                      <span>{item.label}</span>
                      <time>{item.time}</time>
                    </strong>
                  </span>
                  <NextIcon size={18} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className={className('lowerGrid')}>
        <section
          className={`${className('panel')} ${className('sales')}`}
          aria-labelledby="promoter-performance-title"
        >
          <div className={className('sectionHeading')}>
            <div className={className('performanceCopy')}>
              <h2 id="promoter-performance-title">Performance</h2>
              <p>Tickets attributed · Last 7 days</p>
            </div>
            <div className={className('chartTotal')}>
              <span>TICKETS ATTRIBUTED</span>
              <strong>{currentTotal}</strong>
            </div>
          </div>
          <div className={className('chart')}>
            <div className={className('yLabels')} aria-hidden="true">
              <span>200</span>
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <svg
              viewBox="0 0 650 182"
              preserveAspectRatio="none"
              role="img"
              aria-label="Tickets attributed over the last seven days compared with the previous seven days"
            >
              <defs>
                <linearGradient id="promoter-attributed-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f44a22" stopOpacity=".23" />
                  <stop offset="1" stopColor="#f44a22" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g className={className('gridLines')}>
                <line x1="0" y1="0" x2="650" y2="0" />
                <line x1="0" y1="45.5" x2="650" y2="45.5" />
                <line x1="0" y1="91" x2="650" y2="91" />
                <line x1="0" y1="136.5" x2="650" y2="136.5" />
                <line x1="0" y1="182" x2="650" y2="182" />
              </g>
              <path
                d={`${chartPath(currentPerformance)} L 650 182 L 0 182 Z`}
                fill="url(#promoter-attributed-fill)"
              />
              <path className={className('previousLine')} d={chartPath(previousPerformance)} />
              <path className={className('currentLine')} d={chartPath(currentPerformance)} />
              {currentPerformance.map((value, index) => {
                const point = chartPoint(value, index, currentPerformance.length);
                return (
                  <circle
                    key={`promoter-point-${String(index)}`}
                    className={className('currentPoint')}
                    cx={point.x}
                    cy={point.y}
                    r={index === currentPerformance.length - 1 ? 4.5 : 3}
                    aria-hidden="true"
                  />
                );
              })}
            </svg>
            <div className={className('xLabels')} aria-hidden="true">
              {['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'].map(
                (label) => (
                  <span key={label}>{label}</span>
                ),
              )}
            </div>
          </div>
          <div className={className('legend')}>
            <span className={className('currentLegend')}>Current 7 days</span>
            <span className={className('previousLegend')}>Previous 7 days</span>
          </div>
        </section>

        <section
          className={`${className('panel')} ${className('upcoming')}`}
          aria-labelledby="promoter-upcoming-title"
        >
          <div className={className('sectionHeading')}>
            <h2 id="promoter-upcoming-title">Upcoming events</h2>
            <Link href="/promoter/events">View all</Link>
          </div>
          <div className={className('upcomingList')}>
            {upcoming.map((item) => {
              const order = linkedOrders.get(item.label);
              const event = nextEvent?.name === item.label ? nextEvent : undefined;
              const status = event
                ? event.tickets > 0
                  ? `${String(event.tickets)} tickets`
                  : event.status
                : order
                  ? `${String(order.ticketCount)} tickets`
                  : 'Linked';
              return (
                <Link
                  href="/promoter/events"
                  key={`${item.date}-${item.label}`}
                  className={className('upcomingItem')}
                >
                  <span className={className('eventArtwork')} aria-hidden="true">
                    {initials(item.label)}
                  </span>
                  <span className={className('eventCopy')}>
                    <strong>{item.label}</strong>
                    <span>{event?.venue ?? 'Linked event'}</span>
                  </span>
                  <span className={className('statusTag')}>
                    <strong className={className('confirmed')}>{status}</strong>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
