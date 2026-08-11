import Image from 'next/image';
import Link from 'next/link';


import { getHostEvent, hostCampaigns, hostGuests, hostPromoters } from './host-studio-model';
import {
  HostButton,
  HostHeader,
  HostMetric,
  HostPage,
  HostStatus,
  HostTable,
  HostTabs,
} from './HostStudioUi';

import type { ReactNode } from 'react';

const eventTabs = (id: string) => [
  { label: 'Summary', value: 'summary', href: `/host/events/${id}` },
  { label: 'Guests', value: 'guests', href: `/host/events/${id}/guests` },
  { label: 'Promoters', value: 'promoters', href: `/host/events/${id}/promoters` },
  { label: 'Marketing', value: 'marketing', href: `/host/events/${id}/marketing` },
  { label: 'Earnings', value: 'earnings', href: `/host/events/${id}/earnings` },
];

function EventFrame({
  id,
  active,
  children,
}: {
  readonly id: string;
  readonly active: string;
  readonly children: ReactNode;
}) {
  const event = getHostEvent(id);
  if (!event)
    return (
      <HostPage>
        <HostHeader title="Event unavailable" description="This event could not be found." />
      </HostPage>
    );
  return (
    <HostPage>
      <div className="host-event-top">
        <Image src={event.poster} width={104} height={104} alt="" />
        <div>
          <HostStatus tone={event.status === 'Live' ? 'success' : 'neutral'}>
            {event.status}
          </HostStatus>
          <h1>{event.name}</h1>
          <p>
            {event.venue} · {event.city}
          </p>
          <span>
            {event.date} · {event.time}
          </span>
        </div>
      </div>
      <HostTabs items={eventTabs(event.id)} active={active} />
      {children}
    </HostPage>
  );
}

export function HostEventSummaryScreen({ id }: { readonly id: string }) {
  const event = getHostEvent(id);
  return (
    <EventFrame id={id} active="summary">
      <section className="host-metric-row">
        <HostMetric
          label="Allocated guests"
          value={event?.guests === null ? 'Unavailable' : String(event?.guests ?? 0)}
        />
        <HostMetric
          label="Confirmed"
          value={event?.confirmed === null ? 'Unavailable' : String(event?.confirmed ?? 0)}
          tone="success"
        />
        <HostMetric label="Promoters" value="3" />
        <HostMetric
          label="Expected earnings"
          value="₹86,200"
          detail="Authoritative payout estimate"
        />
      </section>
      <div className="host-dashboard-grid">
        <section className="host-panel">
          <div className="host-section-head">
            <div>
              <h2>Guest confirmations</h2>
              <p>Confirmation activity supplied for your allocation.</p>
            </div>
          </div>
          <div className="host-line-chart">
            <svg viewBox="0 0 640 190" role="img" aria-label="Guest confirmations">
              <path className="grid" d="M0 38H640M0 95H640M0 152H640" />
              <path
                className="line"
                d="M8 156 L112 146 L216 122 L320 110 L424 76 L528 60 L632 36"
              />
            </svg>
          </div>
        </section>
        <section className="host-panel host-info-list">
          <h2>Your role</h2>
          <div>
            <span>Role</span>
            <strong>Lead host</strong>
          </div>
          <div>
            <span>Venue contact</span>
            <strong>Arjun Mehta</strong>
          </div>
          <div>
            <span>Guest allocation</span>
            <strong>340 guests</strong>
          </div>
          <details>
            <summary>Event information</summary>
            <p>Age limit 21+ · Smart casual · Doors open 9:00 PM.</p>
          </details>
        </section>
      </div>
    </EventFrame>
  );
}

export function HostEventGuestsScreen({ id }: { readonly id: string }) {
  return (
    <EventFrame id={id} active="guests">
      <div className="host-toolbar">
        <label>
          <span className="sr-only">Search guests</span>
          <input type="search" placeholder="Search name or ticket" />
        </label>
        <HostStatus>Host allocation only</HostStatus>
      </div>
      <HostTable
        columns={['Guest', 'Ticket type', 'Qty', 'Status', '']}
        label="Host guest allocation"
      >
        <>
          {hostGuests.map((guest) => (
            <tr key={guest[0]}>
              <td>
                <strong>{guest[0]}</strong>
              </td>
              <td>{guest[1]}</td>
              <td>{guest[2]}</td>
              <td>
                <HostStatus tone={guest[3] === 'Confirmed' ? 'success' : 'warning'}>
                  {guest[3]}
                </HostStatus>
              </td>
              <td>
                <button type="button" className="host-link-button">
                  View
                </button>
              </td>
            </tr>
          ))}
        </>
      </HostTable>
    </EventFrame>
  );
}

export function HostEventPromotersScreen({ id }: { readonly id: string }) {
  return (
    <EventFrame id={id} active="promoters">
      <HostTable
        columns={['Promoter', 'Role', 'Status', 'Relationship', '']}
        label="Event promoters"
      >
        <>
          {hostPromoters.map((promoter) => (
            <tr key={promoter[0]}>
              <td>
                <strong>{promoter[0]}</strong>
              </td>
              <td>{promoter[1]}</td>
              <td>
                <HostStatus tone={promoter[2] === 'Active' ? 'success' : 'warning'}>
                  {promoter[2]}
                </HostStatus>
              </td>
              <td>{promoter[3]}</td>
              <td>
                <Link
                  href={`/host/partners/promoters/${promoter[0].toLowerCase().replaceAll(' ', '-')}`}
                >
                  Profile
                </Link>
              </td>
            </tr>
          ))}
        </>
      </HostTable>
    </EventFrame>
  );
}

export function HostEventMarketingScreen({ id }: { readonly id: string }) {
  return (
    <EventFrame id={id} active="marketing">
      <div className="host-dashboard-grid">
        <section className="host-panel">
          <div className="host-section-head">
            <div>
              <h2>Event message</h2>
              <p>Send a focused update to your allocated audience.</p>
            </div>
            <HostButton href="/host/marketing" primary>
              Compose
            </HostButton>
          </div>
          <div className="host-message-card">
            <span>Share link</span>
            <strong>thec1rcle.in/e/neon-nights</strong>
            <button type="button">Copy</button>
          </div>
        </section>
        <section className="host-panel">
          <h2>Recent messages</h2>
          <div className="host-compact-list">
            {hostCampaigns.slice(0, 2).map((campaign) => (
              <div key={campaign[0]}>
                <div>
                  <strong>{campaign[0]}</strong>
                  <span>
                    {campaign[1]} · {campaign[2]}
                  </span>
                </div>
                <HostStatus tone="success">{campaign[3]}</HostStatus>
              </div>
            ))}
          </div>
        </section>
      </div>
    </EventFrame>
  );
}

export function HostEventEarningsScreen({ id }: { readonly id: string }) {
  return (
    <EventFrame id={id} active="earnings">
      <section className="host-metric-row">
        <HostMetric label="Host fee" value="₹60,000" />
        <HostMetric label="Performance bonus" value="₹26,200" />
        <HostMetric label="Expected payout" value="₹86,200" tone="success" />
        <HostMetric label="Payout date" value="Fri, 18 Jul" />
      </section>
      <section className="host-panel">
        <div className="host-section-head">
          <div>
            <h2>Payment activity</h2>
            <p>Only earnings assigned to your Host agreement.</p>
          </div>
        </div>
        <div className="host-info-list">
          <div>
            <span>Event completed</span>
            <strong>Awaiting final venue settlement</strong>
          </div>
          <div>
            <span>Destination</span>
            <strong>HDFC ••4412</strong>
          </div>
          <div>
            <span>Terms</span>
            <strong>Fixed host fee + confirmed bonus</strong>
          </div>
        </div>
      </section>
    </EventFrame>
  );
}

export function HostLegacyAnalyticsRedirectNotice({ id }: { readonly id: string }) {
  return (
    <EventFrame id={id} active="summary">
      <section className="host-panel host-empty">
        <h2>Host analytics moved</h2>
        <p>
          Host-safe guest and earnings information is available in Summary and Earnings. Venue sales
          analytics are not exposed here.
        </p>
        <HostButton href={`/host/events/${id}`}>Open summary</HostButton>
      </section>
    </EventFrame>
  );
}
