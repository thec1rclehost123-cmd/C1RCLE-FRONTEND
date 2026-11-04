import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';

export async function ConnectedEventSectionUnavailable({
  eventId,
  section,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly section: string;
}) {
  await loadPartnerEvent(eventId);
  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <section className="rounded-2xl border border-white/15 bg-neutral-950 p-5">
          <h1 className="text-2xl font-bold">{section}</h1>
          <p className="mt-2 text-stone-300">Not connected yet.</p>
        </section>
      </main>
    </PageContainer>
  );
}
