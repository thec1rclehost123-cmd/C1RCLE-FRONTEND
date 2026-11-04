import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

export function HostEventInvitationsUnavailable({ detail = false }: { readonly detail?: boolean }) {
  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <Link
          href="/partner/host/slot-requests"
          className="text-sm font-medium text-stone-400 no-underline hover:text-stone-100"
        >
          ← Host Slot Requests
        </Link>
        <section className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-7">
          <h1>{detail ? 'Event invitation unavailable' : 'Event invitations unavailable'}</h1>
          <p className="leading-7 text-stone-300">
            Host event invitations and their terms are not connected to an authoritative service in
            this workspace. Venue dates and requests are available in Host Slot Requests; no sample
            invitation data is shown.
          </p>
        </section>
      </main>
    </PageContainer>
  );
}
