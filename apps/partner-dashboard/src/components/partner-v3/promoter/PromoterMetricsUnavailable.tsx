import { PageContainer } from '@/components/partner-v3/PagePrimitives';

export function PromoterMetricsUnavailable({
  section,
}: {
  readonly section: 'Overview' | 'Analytics';
}) {
  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <section className="rounded-2xl border border-white/15 bg-neutral-950 p-7">
          <h1>Promoter {section.toLowerCase()} unavailable</h1>
          <p className="leading-7 text-stone-300">
            This dashboard still needs an authoritative promoter metrics read model. Commission,
            clicks, conversions, and activity samples are hidden rather than shown as real results.
            Assigned events are available in the Events workspace.
          </p>
        </section>
      </main>
    </PageContainer>
  );
}
