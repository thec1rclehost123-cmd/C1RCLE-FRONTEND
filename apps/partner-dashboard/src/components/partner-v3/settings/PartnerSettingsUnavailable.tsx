import { PageContainer } from '@/components/partner-v3/PagePrimitives';

export function PartnerSettingsUnavailable({ studio }: { readonly studio: 'host' | 'venue' }) {
  const label = studio === 'host' ? 'Host' : 'Venue';
  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <section className="rounded-2xl border border-white/15 bg-neutral-950 p-7">
          <h1>{label} settings unavailable</h1>
          <p className="leading-7 text-stone-300">
            Settings are not connected to an authoritative organization profile service yet. Sample
            profile and menu values are hidden in the connected workspace.
          </p>
        </section>
      </main>
    </PageContainer>
  );
}
