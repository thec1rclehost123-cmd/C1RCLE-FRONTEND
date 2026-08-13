import Image from 'next/image';
import Link from 'next/link';

import { hostEvents, hostPartners, hostSlotRequests } from './host-studio-model';
import { HostButton, HostHeader, HostMetric, HostPage, HostStatus } from './HostStudioUi';

export function HostOverviewScreen() {
  const nextEvent = hostEvents[0];
  return (
    <HostPage>
      <HostHeader
        title="Good evening, Rhea"
        description="Your events, partners, and payouts at a glance."
        action={<HostButton href="/host/settings?tab=availability">Availability</HostButton>}
      />
      {nextEvent ? (
        <section className="host-tonight">
          <Image src={nextEvent.poster} width={104} height={104} sizes="104px" alt="" />
          <div>
            <HostStatus tone="success">Hosting tonight</HostStatus>
            <h2>{nextEvent.name}</h2>
            <p>
              {nextEvent.venue} · {nextEvent.time}
            </p>
          </div>
          <HostButton href={`/host/events/${nextEvent.id}`} primary>
            Open event
          </HostButton>
        </section>
      ) : null}
      <section className="host-metric-row">
        <HostMetric label="Upcoming events" value="3" detail="Next 30 days" />
        <HostMetric
          label="Pending invitations"
          value="1"
          detail="Reply by tomorrow"
          tone="warning"
        />
        <HostMetric
          label="Active partners"
          value={String(hostPartners.filter((item) => item.status === 'Active').length)}
          detail="Venues and promoters"
        />
        <HostMetric label="Next payout" value="₹86,200" detail="Fri, 18 Jul" tone="success" />
      </section>
      <div className="host-dashboard-grid">
        <section className="host-panel">
          <div className="host-section-head">
            <div>
              <h2>Guest confirmations</h2>
              <p>Across your confirmed events.</p>
            </div>
            <strong>682</strong>
          </div>
          <div className="host-line-chart" aria-label="Guest confirmations over seven days">
            <svg viewBox="0 0 640 190" role="img">
              <path className="grid" d="M0 38H640M0 95H640M0 152H640" />
              <path
                className="line"
                d="M8 152 L112 128 L216 136 L320 88 L424 104 L528 46 L632 61"
              />
              <g>
                {[
                  [8, 152],
                  [112, 128],
                  [216, 136],
                  [320, 88],
                  [424, 104],
                  [528, 46],
                  [632, 61],
                ].map(([x, y]) => (
                  <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r="4" />
                ))}
              </g>
            </svg>
            <div>
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
        <section className="host-panel">
          <div className="host-section-head">
            <div>
              <h2>Upcoming</h2>
              <p>Confirmed dates and requests.</p>
            </div>
            <Link href="/host/events">View all</Link>
          </div>
          <div className="host-compact-list">
            {hostEvents.slice(1, 4).map((event) => (
              <Link href={`/host/events/${event.id}`} key={event.id}>
                <Image src={event.poster} width={48} height={48} sizes="48px" alt="" />
                <div>
                  <strong>{event.name}</strong>
                  <span>
                    {event.date} · {event.venue}
                  </span>
                </div>
                <HostStatus tone={event.status === 'Requested' ? 'warning' : 'neutral'}>
                  {event.status}
                </HostStatus>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <section className="host-panel host-activity">
        <div className="host-section-head">
          <div>
            <h2>Recent activity</h2>
            <p>Updates that need your attention.</p>
          </div>
        </div>
        <div className="host-activity-grid">
          <Link href="/host/events/invitations">
            <span>Invitation</span>
            <strong>Neon Nights invite</strong>
            <small>Reply by tomorrow</small>
          </Link>
          <Link href={`/host/events/requests/${hostSlotRequests[0]?.id ?? ''}`}>
            <span>Slot request</span>
            <strong>After Hours</strong>
            <small>Pending venue response</small>
          </Link>
          <Link href="/host/finance">
            <span>Payout</span>
            <strong>₹1,24,500 paid</strong>
            <small>HDFC ••4412</small>
          </Link>
        </div>
      </section>
    </HostPage>
  );
}
