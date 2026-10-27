import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import type { PartnerEventsData } from '@/data/partner-data-source';

export function ConnectedPartnerGuestsIndexScreen({
  data,
  studio,
}: {
  readonly data: PartnerEventsData;
  readonly studio: 'host' | 'venue';
}) {
  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl py-7 text-stone-100">
        <h1 className="text-3xl font-bold tracking-tight">Guests</h1>
        <p className="mt-2 max-w-2xl text-stone-300">
          Choose an event to view its tenant-scoped attendee roster. Guest names stay on the
          event-specific endpoint and are not aggregated across the organization here.
        </p>
        {data.events.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-7">
            <p className="text-stone-400">No events are available for this organization.</p>
          </section>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.events.map((event) => (
              <Link
                key={event.id}
                href={`/partner/${studio}/events/${encodeURIComponent(event.id)}/guests`}
                className="rounded-2xl border border-white/15 bg-neutral-950 p-6 no-underline transition hover:border-white/40"
              >
                <p className="text-sm text-stone-400">{event.dateLabel}</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-100">{event.name}</h2>
                <p className="mt-2 text-sm text-stone-300">{event.venue}</p>
                <p className="mt-5 text-sm text-stone-400">
                  {event.sold === null
                    ? 'Ticket count unavailable'
                    : `${event.sold.toLocaleString('en-IN')} tickets sold`}{' '}
                  · View attendees →
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </PageContainer>
  );
}
