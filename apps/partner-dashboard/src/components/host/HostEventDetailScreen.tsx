'use client';

import Link from 'next/link';

import { DoorModeIcon, EditIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import {
  EventDetailLayout,
  type SharedEventDetailHeaderModel,
} from '../venue/event-detail/EventDetailLayout';
import layoutStyles from '../venue/event-detail/EventDetailLayout.module.css';
import { EventInformationAccordion } from '../venue/event-detail/EventInformationAccordion';
import styles from '../venue/event-detail/VenueEventDetail.module.css';

import { getHostEvent, hostCampaigns, hostGuests, hostPromoters } from './host-studio-model';

import type { ReactNode } from 'react';

const s = (name: string) => styles[name] ?? name;

const eventTabs = (id: string) => [
  { label: 'Summary', href: `/host/events/${id}` },
  { label: 'Guests', href: `/host/events/${id}/guests` },
  { label: 'Promoters', href: `/host/events/${id}/promoters` },
  { label: 'Marketing', href: `/host/events/${id}/marketing` },
  { label: 'Earnings', href: `/host/events/${id}/earnings` },
];

function HostHeaderActions({
  event,
}: {
  readonly event: NonNullable<ReturnType<typeof getHostEvent>>;
}) {
  const auth = useDashboardAuth();
  const canEdit = auth.canDo('canEditEvent');
  const canManageDoor = auth.canDo('canManageDoorMode');
  const isLive = event.status === 'Live';
  const isCompleted = event.status === 'Completed';

  const showDoorMode = isLive && canManageDoor;
  const showEdit = !isCompleted && canEdit;

  if (!showDoorMode && !showEdit) return null;

  return (
    <div className={layoutStyles['eventActions']} aria-label={`Actions for ${event.name}`}>
      {showEdit ? (
        <Link href={`/host/events/${event.id}/guests`}>
          <EditIcon size={18} aria-hidden="true" />
          Edit event
        </Link>
      ) : null}
      {showDoorMode ? (
        <Link className={layoutStyles['primaryAction']} href={`/venue/door?eventId=${event.id}`}>
          <DoorModeIcon size={19} aria-hidden="true" />
          Open door mode
        </Link>
      ) : null}
    </div>
  );
}

function EventFrame({
  id,
  active: _active,
  children,
}: {
  readonly id: string;
  readonly active?: string;
  readonly children: ReactNode;
}) {
  const event = getHostEvent(id);
  if (!event) {
    return (
      <div className="p-8 text-white">
        <h1>Event unavailable</h1>
        <p>This event could not be found.</p>
      </div>
    );
  }

  const headerModel: SharedEventDetailHeaderModel = {
    id: event.id,
    name: event.name,
    venue: `${event.venue} · ${event.city}`,
    dateTimeLabel: `${event.date} · ${event.time}`,
    posterSrc: event.poster,
    posterAlt: event.name,
    statusLabel: event.status,
    statusTone:
      event.status === 'Live' ? 'success' : event.status === 'Invitation' ? 'warning' : 'neutral',
    roleLabel: 'Lead host',
  };

  return (
    <EventDetailLayout
      event={headerModel}
      tabs={eventTabs(event.id)}
      actions={<HostHeaderActions event={event} />}
    >
      {children}
    </EventDetailLayout>
  );
}

export function HostEventSummaryScreen({ id }: { readonly id: string }) {
  const event = getHostEvent(id);
  const chartPath = 'M 0 160 L 100 140 L 200 110 L 300 95 L 400 65 L 500 50 L 600 30';

  return (
    <EventFrame id={id} active="summary">
      <div className={s('summaryPage')}>
        <div className={s('metricStrip')}>
          <article>
            <span>Allocated guests</span>
            <strong>{event?.guests !== null ? event?.guests : '—'}</strong>
          </article>
          <article>
            <span>Confirmed guests</span>
            <strong>{event?.confirmed !== null ? event?.confirmed : '—'}</strong>
          </article>
          <article>
            <span>Expected earnings</span>
            <strong>₹86,200</strong>
          </article>
        </div>

        <div className={s('summaryGrid')}>
          <section className={s('panel')}>
            <div className={s('panelHeading')}>
              <h2>Guest confirmations</h2>
            </div>
            <div className={s('chart')}>
              <div className={s('yLabels')} aria-hidden="true">
                <span>200</span>
                <span>150</span>
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
              <svg
                viewBox="0 0 600 180"
                preserveAspectRatio="none"
                role="img"
                aria-label="Guest confirmations line chart"
              >
                <g className={s('gridLines')}>
                  <line x1="0" y1="0" x2="600" y2="0" />
                  <line x1="0" y1="45" x2="600" y2="45" />
                  <line x1="0" y1="90" x2="600" y2="90" />
                  <line x1="0" y1="135" x2="600" y2="135" />
                  <line x1="0" y1="180" x2="600" y2="180" />
                </g>
                <path className={s('chartLine')} d={chartPath} />
              </svg>
              <div className={s('xLabels')} aria-hidden="true">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </section>

          <div className="grid gap-4">
            <section className={s('panel')}>
              <h2>Your role</h2>
              <div className="grid gap-3 mt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--dashboard-text-secondary)]">Role</span>
                  <strong>Lead host</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--dashboard-text-secondary)]">Venue contact</span>
                  <strong>Arjun Mehta</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--dashboard-text-secondary)]">Guest allocation</span>
                  <strong>250 guests</strong>
                </div>
              </div>
            </section>

            <EventInformationAccordion
              information={{
                venue: event?.venue ?? 'Skyline Rooftop',
                address: '12th Floor, Trade Tower, Lower Parel, Mumbai',
                startAndEnd: `${event?.date ?? 'Thu 16 Jul'} · 9:00 PM – 3:00 AM`,
                ageLimit: 'Age limit 21+',
                dressCode: 'Smart casual',
                entryMethod: 'Host guestlist & ticket check-in at door',
                contact: 'rhea@thec1rcle.in',
              }}
            />
          </div>
        </div>
      </div>
    </EventFrame>
  );
}

export function HostEventGuestsScreen({ id }: { readonly id: string }) {
  return (
    <EventFrame id={id} active="guests">
      <div className={s('guestsPage')}>
        <div className={s('guestToolbar')}>
          <label className={s('guestSearch')}>
            <span className="sr-only">Search guests</span>
            <input type="search" placeholder="Search guest name or ticket" />
          </label>
        </div>
        <section className={s('guestTable')} aria-label="Host guest allocation">
          <table>
            <thead>
              <tr>
                <th scope="col">Guest</th>
                <th scope="col">Ticket type</th>
                <th scope="col">Qty</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {hostGuests.map((guest) => (
                <tr key={guest[0]}>
                  <td>
                    <div className={s('guestAvatar')}>
                      {guest[0]
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className={s('guestIdentity')}>
                      <strong>{guest[0]}</strong>
                    </div>
                  </td>
                  <td>{guest[1]}</td>
                  <td>{guest[2]}</td>
                  <td>
                    <span className={s('checkInState')} data-checked-in={guest[3] === 'Confirmed'}>
                      {guest[3]}
                    </span>
                  </td>
                  <td className="text-right">
                    <button type="button" className="pd-button h-9 min-h-9 px-3.5 text-[13px]">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </EventFrame>
  );
}

export function HostEventPromotersScreen({ id }: { readonly id: string }) {
  return (
    <EventFrame id={id} active="promoters">
      <div className={s('guestsPage')}>
        <section className={s('guestTable')} aria-label="Event promoters">
          <table>
            <thead>
              <tr>
                <th scope="col">Promoter</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Relationship</th>
                <th scope="col" className="text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {hostPromoters.map((promoter) => (
                <tr key={promoter[0]}>
                  <td>
                    <div className={s('guestAvatar')}>
                      {promoter[0]
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className={s('guestIdentity')}>
                      <strong>{promoter[0]}</strong>
                    </div>
                  </td>
                  <td>{promoter[1]}</td>
                  <td>
                    <span className={s('checkInState')} data-checked-in={promoter[2] === 'Active'}>
                      {promoter[2]}
                    </span>
                  </td>
                  <td>{promoter[3]}</td>
                  <td className="text-right">
                    <Link
                      href={`/host/partners/promoters/${promoter[0].toLowerCase().replaceAll(' ', '-')}`}
                      className="pd-button h-9 min-h-9 px-3.5 text-[13px] inline-flex"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </EventFrame>
  );
}

export function HostEventMarketingScreen({ id }: { readonly id: string }) {
  return (
    <EventFrame id={id} active="marketing">
      <div className={s('salesGrid')}>
        <section className={s('panel')}>
          <div className={s('panelHeading')}>
            <h2>Event message</h2>
            <Link href="/host/marketing">Compose</Link>
          </div>
          <div className="mt-4 p-4 bg-[var(--dashboard-surface)] rounded-xl border border-[var(--dashboard-border)]">
            <span className="text-xs text-[var(--dashboard-text-secondary)]">Share link</span>
            <div className="flex justify-between items-center mt-1">
              <strong>thec1rcle.in/e/neon-nights</strong>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg border border-[var(--dashboard-border)] bg-transparent text-white cursor-pointer"
              >
                Copy
              </button>
            </div>
          </div>
        </section>
        <section className={s('panel')}>
          <h2>Recent messages</h2>
          <div className="grid gap-3 mt-4">
            {hostCampaigns.slice(0, 2).map((campaign) => (
              <div
                key={campaign[0]}
                className="flex justify-between items-center py-3 border-t border-[var(--dashboard-border)]"
              >
                <div>
                  <strong className="block text-sm">{campaign[0]}</strong>
                  <span className="text-xs text-[var(--dashboard-text-secondary)]">
                    {campaign[1]} · {campaign[2]}
                  </span>
                </div>
                <span className={s('orderStatus')}>{campaign[3]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </EventFrame>
  );
}

export function HostEventEarningsScreen({ id }: { readonly id: string }) {
  const event = getHostEvent(id);
  const isCompleted = event?.status === 'Completed';

  return (
    <EventFrame id={id} active="earnings">
      <div className={s('summaryPage')}>
        <div className={s('metricStrip')}>
          <article>
            <span>Host fee</span>
            <strong>₹60,000</strong>
          </article>
          <article>
            <span>Performance bonus</span>
            <strong>₹26,200</strong>
          </article>
          <article>
            <span>Expected payout</span>
            <strong>₹86,200</strong>
          </article>
        </div>

        <section className={s('panel')}>
          <div className={s('panelHeading')}>
            <h2>Payment / settlement details</h2>
          </div>
          <div className="grid gap-4 mt-4">
            <div className="flex justify-between border-b border-[var(--dashboard-border)] pb-3">
              <span className="text-[var(--dashboard-text-secondary)]">Event status</span>
              <strong>{event?.status ?? 'Upcoming'}</strong>
            </div>
            <div className="flex justify-between border-b border-[var(--dashboard-border)] pb-3">
              <span className="text-[var(--dashboard-text-secondary)]">Expected destination</span>
              <strong>HDFC ••4412</strong>
            </div>
            <div className="flex justify-between border-b border-[var(--dashboard-border)] pb-3">
              <span className="text-[var(--dashboard-text-secondary)]">Terms</span>
              <strong>Fixed host fee + confirmed bonus</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--dashboard-text-secondary)]">Settlement</span>
              <strong>
                {isCompleted ? 'Awaiting final venue settlement' : 'After event completion'}
              </strong>
            </div>
          </div>
        </section>
      </div>
    </EventFrame>
  );
}

export function HostLegacyAnalyticsRedirectNotice({ id }: { readonly id: string }) {
  return (
    <EventFrame id={id} active="summary">
      <section className={s('panel')}>
        <h2>Host analytics moved</h2>
        <p className="text-[var(--dashboard-text-secondary)] mt-2 mb-4">
          Host-safe guest and earnings information is available in Summary and Earnings. Venue sales
          analytics are not exposed here.
        </p>
        <Link href={`/host/events/${id}`} className="pd-button">
          Open summary
        </Link>
      </section>
    </EventFrame>
  );
}
