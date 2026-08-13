import { notFound } from 'next/navigation';

import { acceptedEvents, partnerById } from './promoter-studio-model';
import { UnavailableAction } from './PromoterStudioActions';
import { MetricStrip, PromoterButton, StatusBadge } from './PromoterStudioUi';

export function PromoterPartnerProfilePage({
  id,
  kind,
}: {
  readonly id: string;
  readonly kind: 'venue' | 'host';
}) {
  const partner = partnerById(id);
  if (partner?.kind !== kind) notFound();
  const sharedEvents = acceptedEvents.filter((event) =>
    kind === 'venue' ? event.venue === partner.name : event.host === partner.name,
  );
  return (
    <div className="pr-page">
      <PromoterButton
        href={kind === 'venue' ? '/promoter/partners' : '/promoter/partners/hosts'}
        tone="quiet"
      >
        ← Back to partners
      </PromoterButton>
      <section className="pr-profile-hero pr-glass-panel">
        <div className="pr-partner-avatar pr-partner-avatar--large">{partner.initials}</div>
        <div>
          <span className="pr-eyebrow">{kind} profile</span>
          <h1>{partner.name}</h1>
          <p>
            {partner.city} · {partner.category}
          </p>
        </div>
        {partner.verified ? <StatusBadge state="verified" /> : null}
        <div className="pr-profile-action">
          {partner.relationship === 'partnered' ? (
            <span className="pr-badge pr-badge--accepted">Partnered</span>
          ) : (
            <UnavailableAction
              label="Request partnership"
              title="Request unavailable"
              description="The partnership request adapter is not connected. No request has been sent."
            />
          )}
        </div>
      </section>
      <MetricStrip
        items={[
          { label: 'Events together', value: partner.eventsTogether.toString() },
          { label: 'Tickets moved together', value: partner.ticketsMoved.toLocaleString('en-IN') },
          { label: 'Typical response', value: partner.response.replace('Usually replies ', '') },
        ]}
      />
      <section className="pr-section pr-glass-panel">
        <header>
          <div>
            <span className="pr-eyebrow">Credibility</span>
            <h2>{kind === 'venue' ? 'Hosted events' : 'Promoted events'}</h2>
          </div>
        </header>
        {sharedEvents.length ? (
          <ul className="pr-simple-list">
            {sharedEvents.map((event) => (
              <li key={event.id}>
                <div>
                  <strong>{event.name}</strong>
                  <small>
                    {event.date} · {event.time}
                  </small>
                </div>
                <PromoterButton href={`/promoter/events/${event.id}`} tone="quiet">
                  Open
                </PromoterButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pr-muted">No shared event history yet.</p>
        )}
      </section>
      <section className="pr-privacy-note">
        <strong>Privacy protected</strong>
        <p>
          Personal phone numbers, email addresses and attendee details are never displayed.
          Partnership communication stays inside THE C1RCLE.
        </p>
      </section>
    </div>
  );
}
