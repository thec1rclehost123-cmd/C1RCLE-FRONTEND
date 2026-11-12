import Link from 'next/link';

import { EmptyState } from '@c1rcle/ui';

import { PageContainer, PageHeader, PageSection } from '@/components/partner-v3/PagePrimitives';

import type { PartnerEventsData } from '@/data/partner-data-source';

export function PartnerDoorSelectionScreen({ data }: { readonly data: PartnerEventsData | null }) {
  if (!data) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow="Venue Studio"
          title="Door"
          description="Choose an upcoming event to open its Door Mode."
        />
        <PageSection>
          <p role="alert">Events could not be loaded.</p>
          <Link href="/partner/venue/door">Retry</Link>
        </PageSection>
      </PageContainer>
    );
  }

  const events = data.events.filter(
    (event) => event.status === 'Live' || event.status === 'Scheduled',
  );
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Venue Studio"
        title="Door"
        description="Choose a published event to open its Door Mode."
      />
      <PageSection>
        {events.length === 0 ? (
          <EmptyState
            title="No upcoming published events"
            description="Door Mode is available from an event after it is published."
          />
        ) : (
          <ul className="grid gap-3" aria-label="Upcoming published events">
            {events.map((event) => (
              <li key={event.id} className="rounded-xl border border-white/15 p-4">
                <Link
                  href={`/partner/venue/events/${encodeURIComponent(event.id)}/door`}
                  className="block"
                >
                  <span className="font-semibold">{event.name}</span>
                  <span className="mt-1 block text-sm text-white/70">
                    {event.venue} · {event.dateLabel} · {event.timeLabel} · {event.status}
                  </span>
                  <span className="mt-3 inline-block text-sm underline">Open Door Mode</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageSection>
      {data.nextCursor ? (
        <Link
          className="mt-4 inline-block underline"
          href={`/partner/venue/door?cursor=${encodeURIComponent(data.nextCursor)}`}
        >
          More events
        </Link>
      ) : null}
    </PageContainer>
  );
}
