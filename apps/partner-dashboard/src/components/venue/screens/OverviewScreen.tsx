import Link from 'next/link';

import {
  AnnouncementIcon,
  BankIcon,
  CheckIcon,
  EmailIcon,
  ForwardIcon,
  GuestIcon,
  LocationIcon,
  NextIcon,
  PartnerIcon,
  TicketIcon,
  UsersIcon,
} from '@c1rcle/icons';

import { venueOverviewModel } from '../overview-model';
import { OverviewCalendar } from '../OverviewCalendar';

import styles from './OverviewScreen.module.css';

import type { VenueOverviewViewModel } from '../overview-model';
import type { IconProps } from '@c1rcle/icons';
import type { ComponentType } from 'react';

const className = (name: string): string => styles[name] ?? name;

const ACTIVITY_ICONS: Readonly<
  Record<VenueOverviewViewModel['activity'][number]['icon'], ComponentType<IconProps>>
> = {
  campaign: EmailIcon,
  check: CheckIcon,
  guest: GuestIcon,
  invoice: BankIcon,
  ticket: TicketIcon,
};

const NETWORK_ICONS: Readonly<
  Record<VenueOverviewViewModel['network'][number]['icon'], ComponentType<IconProps>>
> = {
  artists: AnnouncementIcon,
  guests: GuestIcon,
  partners: UsersIcon,
  venues: PartnerIcon,
};

const chartPath = (values: readonly number[]): string => {
  const width = 650;
  const height = 182;
  const max = 200_000;
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

export function OverviewScreen() {
  return <VenueOverviewContent model={venueOverviewModel} />;
}

export function VenueOverviewContent({ model }: { readonly model: VenueOverviewViewModel | null }) {
  if (!model) {
    return (
      <section className={className('empty')}>
        <span aria-hidden="true">
          <CalendarIcon />
        </span>
        <h1>Your Venue Overview is ready for its first event.</h1>
        <p>Create an event to begin tracking ticket sales, activity, payouts, and your network.</p>
        <Link href="/venue/events/create">Create event</Link>
      </section>
    );
  }

  const currentPath = chartPath(model.sales.currentRupees);
  const previousPath = chartPath(model.sales.previousRupees);

  return (
    <div className={className('overview')}>
      <header className={className('pageHeader')}>
        <div>
          <h1>{model.greeting}</h1>
          <p>{model.dateLabel}</p>
        </div>
        <OverviewCalendar />
      </header>

      <div className={className('topGrid')}>
        <section
          className={`${className('panel')} ${className('tonight')}`}
          aria-labelledby="tonight-title"
        >
          <div className={className('poster')} role="img" aria-label="Neon Nights event artwork">
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
            <span className={className('eyebrow')}>Tonight</span>
            <h2 id="tonight-title">{model.tonight.name}</h2>
            <p className={className('venue')}>
              <LocationIcon size={16} aria-hidden="true" />
              {model.tonight.venue}
            </p>
            <div className={className('tonightStats')}>
              <div className={className('doorTime')}>
                <span>Doors open in</span>
                <strong>{model.tonight.doorsIn}</strong>
                <small>{model.tonight.startTime}</small>
              </div>
              <div className={className('capacity')}>
                <span>Tickets sold</span>
                <div>
                  <strong>{model.tonight.ticketsSold}</strong>
                  <small> / {model.tonight.capacity}</small>
                  <b>{model.tonight.capacityPercent}%</b>
                </div>
                <progress
                  className={className('progress')}
                  value={model.tonight.capacityPercent}
                  max={100}
                  aria-label={`${String(model.tonight.capacityPercent)} percent capacity`}
                />
                <small>Capacity</small>
                <Link href="/venue/door">Open tonight mode</Link>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`${className('panel')} ${className('activity')}`}
          aria-labelledby="activity-title"
        >
          <div className={className('sectionHeading')}>
            <h2 id="activity-title">Recent activity</h2>
            <Link href="/venue/finance">View all</Link>
          </div>
          <div className={className('activityList')}>
            {model.activity.map((item) => {
              const ActivityIcon = ACTIVITY_ICONS[item.icon];
              return (
                <Link
                  key={item.label}
                  href={
                    item.icon === 'invoice' || item.icon === 'check'
                      ? '/venue/finance'
                      : '/venue/events'
                  }
                >
                  <span className={`${className('activityIcon')} ${className(item.tone)}`}>
                    <ActivityIcon size={17} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className={className('activityCopy')}>
                    <strong>{item.label}</strong>
                    <small>
                      {item.context}
                      <i>•</i>
                      {item.time}
                    </small>
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
          aria-labelledby="sales-title"
        >
          <div className={className('sectionHeading')}>
            <h2 id="sales-title">Sales overview</h2>
            <label className={className('rangeLabel')}>
              <span className={className('srOnly')}>Sales period</span>
              <select defaultValue="7d" aria-label="Sales period">
                <option value="7d">Last 7 days</option>
              </select>
            </label>
          </div>
          <div className={className('chart')}>
            <div className={className('yLabels')} aria-hidden="true">
              <span>₹2.0L</span>
              <span>₹1.5L</span>
              <span>₹1.0L</span>
              <span>₹0.5L</span>
              <span>₹0</span>
            </div>
            <svg
              viewBox="0 0 650 182"
              preserveAspectRatio="none"
              role="img"
              aria-label="Gross sales for July 10 through July 16 compared with the previous seven days"
            >
              <defs>
                <linearGradient id="overview-sales-fill" x1="0" y1="0" x2="0" y2="1">
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
              <path d={`${currentPath} L 650 182 L 0 182 Z`} fill="url(#overview-sales-fill)" />
              <path className={className('previousLine')} d={previousPath} />
              <path className={className('currentLine')} d={currentPath} />
              {model.sales.currentRupees.map((value, index) => {
                const x = (index / Math.max(model.sales.currentRupees.length - 1, 1)) * 650;
                const y = 182 - (value / 200_000) * 182;
                return <circle key={`${String(index)}-${String(value)}`} cx={x} cy={y} r="4" />;
              })}
            </svg>
            <div className={className('xLabels')} aria-hidden="true">
              {model.sales.labels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
          <div className={className('legend')}>
            <span className={className('currentLegend')}>Gross sales (₹)</span>
            <span className={className('previousLegend')}>Previous 7 days</span>
          </div>
          <Link className={className('panelFooterLink')} href="/venue/finance">
            View full report <ForwardIcon size={17} aria-hidden="true" />
          </Link>
        </section>

        <div className={className('rightColumn')}>
          <section
            className={`${className('panel')} ${className('upcoming')}`}
            aria-labelledby="upcoming-title"
          >
            <div className={className('sectionHeading')}>
              <h2 id="upcoming-title">Upcoming events</h2>
              <Link href="/venue/events">View all</Link>
            </div>
            <div className={className('upcomingList')}>
              {model.upcoming.map((event) => (
                <Link href="/venue/events" key={event.name}>
                  <span
                    className={`${className('eventArtwork')} ${className(event.artwork)}`}
                    aria-hidden="true"
                  >
                    {event.name
                      .split(' ')
                      .map((word) => word[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span className={className('eventCopy')}>
                    <strong>{event.name}</strong>
                    <small>
                      {event.date}
                      <i>•</i>
                      {event.time}
                    </small>
                    <small>{event.venue}</small>
                  </span>
                  <span className={className('sold')}>
                    <strong>{event.soldPercent}%</strong>
                    <small>Sold</small>
                  </span>
                </Link>
              ))}
            </div>
            <Link className={className('panelFooterLink')} href="/venue/events">
              View calendar <ForwardIcon size={15} aria-hidden="true" />
            </Link>
          </section>

          <section
            className={`${className('panel')} ${className('network')}`}
            aria-labelledby="network-title"
          >
            <div className={className('sectionHeading')}>
              <h2 id="network-title">My network</h2>
            </div>
            <div className={className('networkList')}>
              {model.network.map((item) => {
                const NetworkIcon = NETWORK_ICONS[item.icon];
                return (
                  <div key={item.label}>
                    <span className={`${className('networkIcon')} ${className(item.tone)}`}>
                      <NetworkIcon size={18} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{item.value}</strong>
                      <small>{item.label}</small>
                    </span>
                  </div>
                );
              })}
            </div>
            <Link className={className('panelFooterLink')} href="/venue/partners">
              Manage network <ForwardIcon size={15} aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M7 2v3M17 2v3M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
