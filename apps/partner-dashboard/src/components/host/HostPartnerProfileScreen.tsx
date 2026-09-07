import Link from 'next/link';

import { getHostPartner, hostAvailability, hostEvents } from './host-studio-model';
import { HostButton, HostHeader, HostPage, HostStatus } from './HostStudioUi';

export function HostPartnerProfileScreen({
  kind,
  id,
}: {
  readonly kind: 'venue' | 'promoter';
  readonly id: string;
}) {
  const partner =
    getHostPartner(kind, id) ??
    getHostPartner(kind, kind === 'venue' ? 'skyline-rooftop' : 'karan-shah');
  if (!partner)
    return (
      <HostPage>
        <HostHeader title="Partner unavailable" />
      </HostPage>
    );
  const active = partner.status === 'Active';
  return (
    <HostPage>
      <div className="host-profile-crumb">
        <Link href="/host/partners">Partners</Link>
        <span>/</span>
        <span>{kind === 'venue' ? 'Venues' : 'Promoters'}</span>
        <span>/</span>
        <strong>{partner.name}</strong>
      </div>
      <header className="host-partner-hero">
        <div className="host-partner-avatar is-large">
          {partner.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)}
        </div>
        <div>
          <HostStatus tone={active ? 'success' : 'warning'}>{partner.status}</HostStatus>
          <h1>{partner.name}</h1>
          <p>
            {partner.city} · {partner.detail}
          </p>
        </div>
        {kind === 'venue' && active ? (
          <HostButton primary href="/host/events/create">
            View availability
          </HostButton>
        ) : (
          <HostButton primary disabled>
            {kind === 'venue' ? 'Availability unavailable' : 'Message unavailable'}
          </HostButton>
        )}
      </header>
      <div className="host-profile-grid">
        <div>
          <section className="host-panel">
            <h2>About</h2>
            <p>
              {kind === 'venue'
                ? `${partner.name} is a verified venue partner for intimate music-led events in ${partner.city}.`
                : `${partner.name} is a verified promoter focused on thoughtful local event collaborations.`}
            </p>
          </section>
          <section className="host-panel">
            <h2>{kind === 'venue' ? 'Recent events here' : 'Recent events together'}</h2>
            <div className="host-compact-list">
              {hostEvents.slice(0, 3).map((event) => (
                <Link key={event.id} href={`/host/events/${event.id}`}>
                  <div>
                    <strong>{event.name}</strong>
                    <span>
                      {event.date} · {event.venue}
                    </span>
                  </div>
                  <span>›</span>
                </Link>
              ))}
            </div>
          </section>
          <section className="host-panel">
            <h2>Contact details</h2>
            <div className="host-info-list">
              <div>
                <span>Phone</span>
                <strong>+91 98765 43210</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>hello@{partner.id}.in</strong>
              </div>
            </div>
          </section>
        </div>
        <aside>
          <section className="host-panel">
            <h2>Partnership at a glance</h2>
            <div className="host-info-list">
              <div>
                <span>Shared events</span>
                <strong>{partner.eventsTogether}</strong>
              </div>
              <div>
                <span>Partnership</span>
                <strong>{partner.status}</strong>
              </div>
              <div>
                <span>Verified</span>
                <strong>{partner.verified ? 'Yes' : 'Unavailable'}</strong>
              </div>
              {kind === 'venue' && active ? (
                <div>
                  <span>Available slots</span>
                  <strong>{hostAvailability.slots.length}</strong>
                </div>
              ) : null}
            </div>
          </section>
          <section className="host-panel">
            <h2>Quick actions</h2>
            <div className="host-stack-actions">
              {kind === 'venue' && active ? (
                <HostButton primary href="/host/events/create">
                  Start slot request
                </HostButton>
              ) : (
                <HostButton primary disabled>
                  {kind === 'venue' ? 'Slot request unavailable' : 'Message unavailable'}
                </HostButton>
              )}
              <HostButton disabled title="Contact copying is unavailable in this environment">
                Copy contact
              </HostButton>
            </div>
          </section>
        </aside>
      </div>
    </HostPage>
  );
}
