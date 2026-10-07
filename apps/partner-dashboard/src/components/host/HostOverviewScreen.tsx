import Link from 'next/link';

import { BankIcon, CheckIcon, EmailIcon, LocationIcon, NextIcon, TicketIcon } from '@c1rcle/icons';

import { hostEvents, hostSlotRequests } from './host-studio-model';
import styles from './HostOverviewScreen.module.css';

const className = (name: string): string => styles[name] ?? name;

const chartPath = (values: readonly number[]): string => {
  const width = 650;
  const height = 182;
  const max = 200;
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

const chartPoint = (value: number, index: number, length: number): { x: number; y: number } => ({
  x: (index / Math.max(length - 1, 1)) * 650,
  y: 182 - (value / 200) * 182,
});

export function HostOverviewScreen() {
  const nextEvent = hostEvents[0];
  const confirmationsTrend = [152, 128, 136, 88, 104, 46, 61];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentPath = chartPath(confirmationsTrend);
  const previousPath = chartPath([120, 110, 140, 95, 120, 70, 80]);

  return (
    <div className={className('overview')}>
      <header className={className('pageHeader')}>
        <div>
          <h1>Good evening, Rhea</h1>
          <p>Thursday, July 16</p>
        </div>
        <Link href="/host/settings?tab=availability" className={className('availabilityButton')}>
          Availability
        </Link>
      </header>

      <div className={className('topGrid')}>
        {nextEvent ? (
          <section
            className={`${className('panel')} ${className('tonight')}`}
            aria-labelledby="tonight-title"
          >
            <div
              className={className('poster')}
              role="img"
              aria-label={`${nextEvent.name} artwork`}
            >
              <div className={className('posterCopy')} aria-hidden="true">
                <small>
                  THU <b>16</b> JUL
                </small>
                <strong>
                  NEON
                  <br />
                  NIGHTS
                </strong>
                <span>Afrobeats Edition</span>
              </div>
            </div>
            <div className={className('tonightBody')}>
              <div>
                <span className={className('eyebrow')}>Hosting tonight</span>
                <h2 id="tonight-title">{nextEvent.name}</h2>
                <p className={className('venue')}>
                  <LocationIcon size={16} aria-hidden="true" />
                  {nextEvent.venue} · {nextEvent.city}
                  <span className={className('roleBadge')}>Lead host</span>
                </p>
              </div>

              <div className={className('tonightStats')}>
                <div className={className('doorTime')}>
                  <span>Event starts in</span>
                  <strong>3h 20m</strong>
                  <small>{nextEvent.time}</small>
                </div>
                <div className={className('capacity')}>
                  <span>Confirmed guests</span>
                  <div>
                    <strong>168</strong>
                    <small> / 250</small>
                    <b>67%</b>
                  </div>
                  <progress
                    className={className('progress')}
                    value={67}
                    max={100}
                    aria-label="67 percent confirmed guests allocation"
                  />
                  <small>Guest allocation</small>
                </div>
              </div>

              <Link href={`/host/events/${nextEvent.id}`} className={className('openEventButton')}>
                Open event
              </Link>
            </div>
          </section>
        ) : null}

        <section
          className={`${className('panel')} ${className('activity')}`}
          aria-labelledby="activity-title"
        >
          <div className={className('sectionHeading')}>
            <h2 id="activity-title">Recent activity</h2>
            <Link href="/host/events/invitations">View all</Link>
          </div>
          <div className={className('activityList')}>
            <Link href="/host/events/invitations" className={className('activityItem')}>
              <span className={`${className('activityIcon')} ${className('warning')}`}>
                <CheckIcon size={17} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className={className('activityCopy')}>
                <strong>
                  <span>Neon Nights invitation received</span>
                  <time>Reply by tomorrow</time>
                </strong>
              </span>
              <NextIcon size={18} aria-hidden="true" />
            </Link>

            <Link
              href={`/host/events/requests/${hostSlotRequests[0]?.id ?? ''}`}
              className={className('activityItem')}
            >
              <span className={`${className('activityIcon')} ${className('accent')}`}>
                <TicketIcon size={17} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className={className('activityCopy')}>
                <strong>
                  <span>After Hours slot request pending</span>
                  <time>Pending venue response</time>
                </strong>
              </span>
              <NextIcon size={18} aria-hidden="true" />
            </Link>

            <Link href="/host/finance" className={className('activityItem')}>
              <span className={`${className('activityIcon')} ${className('success')}`}>
                <BankIcon size={17} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className={className('activityCopy')}>
                <strong>
                  <span>₹1,24,500 payout received</span>
                  <time>HDFC ••4412</time>
                </strong>
              </span>
              <NextIcon size={18} aria-hidden="true" />
            </Link>

            <Link href="/host/events" className={className('activityItem')}>
              <span className={`${className('activityIcon')} ${className('accent')}`}>
                <EmailIcon size={17} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className={className('activityCopy')}>
                <strong>
                  <span>Sunset Sessions guest list updated</span>
                  <time>Today, 1:28 PM</time>
                </strong>
              </span>
              <NextIcon size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      <div className={className('lowerGrid')}>
        <section
          className={`${className('panel')} ${className('sales')}`}
          aria-labelledby="confirmations-title"
        >
          <div className={className('sectionHeading')}>
            <div className={className('performanceCopy')}>
              <h2 id="confirmations-title">Performance</h2>
              <p>Daily guest confirmations · Last 7 days</p>
            </div>
            <div className={className('chartTotal')}>
              <span>GUEST CONFIRMATIONS</span>
              <strong>682</strong>
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
              aria-label="Daily guest confirmations over seven days"
            >
              <defs>
                <linearGradient id="host-confirmations-fill" x1="0" y1="0" x2="0" y2="1">
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
              <path d={`${currentPath} L 650 182 L 0 182 Z`} fill="url(#host-confirmations-fill)" />
              <path className={className('previousLine')} d={previousPath} />
              <path className={className('currentLine')} d={currentPath} />
              {confirmationsTrend.map((value, index) => {
                const point = chartPoint(value, index, confirmationsTrend.length);
                return (
                  <circle
                    key={`${String(dayLabels[index] ?? index)}-point`}
                    className={className('currentPoint')}
                    cx={point.x}
                    cy={point.y}
                    r={index === confirmationsTrend.length - 1 ? 4.5 : 3}
                    aria-hidden="true"
                  />
                );
              })}
            </svg>
            <div className={className('xLabels')} aria-hidden="true">
              {dayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
          <div className={className('legend')}>
            <span className={className('currentLegend')}>Daily confirmations</span>
            <span className={className('previousLegend')}>Previous 7 days</span>
          </div>
        </section>

        <div className={className('rightColumn')}>
          <section
            className={`${className('panel')} ${className('upcoming')}`}
            aria-labelledby="upcoming-title"
          >
            <div className={className('sectionHeading')}>
              <h2 id="upcoming-title">Upcoming events</h2>
              <Link href="/host/events">View all</Link>
            </div>
            <div className={className('upcomingList')}>
              {hostEvents.slice(1, 4).map((event) => {
                const statusLabel =
                  event.confirmed !== null
                    ? `${String(event.confirmed)} confirmed`
                    : event.status === 'Requested'
                      ? 'Slot requested'
                      : event.status === 'Invitation'
                        ? 'Invitation'
                        : event.status;
                const isConfirmed = event.confirmed !== null;
                const isWarning = event.status === 'Requested' || event.status === 'Invitation';

                return (
                  <Link
                    href={`/host/events/${event.id}`}
                    key={event.id}
                    className={className('upcomingItem')}
                  >
                    <span className={className('eventArtwork')} aria-hidden="true">
                      {event.name
                        .split(' ')
                        .map((word) => word[0])
                        .join('')
                        .slice(0, 2)}
                    </span>
                    <span className={className('eventCopy')}>
                      <strong>{event.name}</strong>
                      <span>{event.venue}</span>
                    </span>
                    <span className={className('statusTag')}>
                      <strong
                        className={
                          isConfirmed
                            ? className('confirmed')
                            : isWarning
                              ? className('warning')
                              : ''
                        }
                      >
                        {statusLabel}
                      </strong>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
