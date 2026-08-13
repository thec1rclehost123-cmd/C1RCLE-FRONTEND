import { notFound } from 'next/navigation';

import { discoverableEvents } from '@/components/promoter/promoter-studio-model';
import { UnavailableAction } from '@/components/promoter/PromoterStudioActions';
import {
  EventAtmosphere,
  PromoterButton,
  ReadOnlyTerms,
  StatusBadge,
} from '@/components/promoter/PromoterStudioUi';

export default async function DiscoverEventPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const id = (await params).eventId;
  const event = discoverableEvents.find((item) => item.id === id);
  if (!event) notFound();
  return (
    <div className="pr-page pr-event-scope">
      <EventAtmosphere event={event} />
      <PromoterButton href="/promoter/events/discover" tone="quiet">
        ← Back to discover
      </PromoterButton>
      <section className="pr-review-card pr-glass-panel">
        <div>
          <StatusBadge state="requestable" />
          <span className="pr-eyebrow">Verified opportunity</span>
          <h1>{event.name}</h1>
          <p>
            {event.venue} · {event.city} · {event.date} · {event.time}
          </p>
        </div>
        <p>
          Request promoter access to let the venue or host review your network profile and
          performance signals.
        </p>
        <UnavailableAction
          label="Request access"
          title="Request unavailable"
          description="A verified request adapter is not available. Your partnership state has not changed."
        />
      </section>
      <ReadOnlyTerms event={event} />
    </div>
  );
}
