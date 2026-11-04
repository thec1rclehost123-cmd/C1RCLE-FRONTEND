import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import type { PromoterDiscoverEvent } from '@/data/partner-data-source';

export function PromoterPublicEventDetailsScreen({
  event,
}: {
  readonly event: PromoterDiscoverEvent;
}) {
  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl py-7 text-stone-100">
        <section className="rounded-2xl border border-white/10 bg-[#111113] p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Event details</h2>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-stone-300">
              No promoter assignment yet
            </span>
          </div>
          {event.summary ? <p className="max-w-3xl leading-7">{event.summary}</p> : null}
          {event.description && event.description !== event.summary ? (
            <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-7 text-stone-300">
              {event.description}
            </p>
          ) : null}
        </section>
      </main>
    </PageContainer>
  );
}
