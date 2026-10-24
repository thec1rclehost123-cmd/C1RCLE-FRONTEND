import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';

export async function ConnectedEventSectionUnavailable({
  studio,
  eventId,
  section,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly section: string;
}) {
  const event = await loadPartnerEvent(eventId);
  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/events/${encodeURIComponent(event.id)}`}
          className="text-sm font-medium text-stone-400 no-underline hover:text-stone-100"
        >
          ← {event.title}
        </Link>
        <section className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-7">
          <h1>{section} unavailable</h1>
          <p className="leading-7 text-stone-300">
            This section is not connected to an authoritative event service yet. No sample sales,
            attendee, promoter, or operational data is shown here.
          </p>
        </section>
      </main>
    </PageContainer>
  );
}
