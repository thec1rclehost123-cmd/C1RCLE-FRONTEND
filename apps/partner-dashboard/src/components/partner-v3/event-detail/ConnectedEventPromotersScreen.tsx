import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import type { ReferralLinkDto } from '@c1rcle/contracts';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export function ConnectedEventPromotersScreen({
  studio,
  eventId,
  eventTitle,
  links,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly eventTitle: string;
  readonly links: readonly ReferralLinkDto[];
}) {
  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/events/${encodeURIComponent(eventId)}`}
          className="text-sm text-stone-400"
        >
          ← {eventTitle}
        </Link>
        <section className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-7">
          <h1 className="text-3xl font-bold">Promoter metrics</h1>
          {links.length === 0 ? (
            <p className="mt-8 text-stone-400">
              No promoter referral links are recorded for this event.
            </p>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/15 text-stone-400">
                  <tr>
                    <th className="py-3">Campaign</th>
                    <th>Clicks</th>
                    <th>Conversions</th>
                    <th>Revenue</th>
                    <th>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id} className="border-b border-white/10">
                      <td className="py-3">{link.label}</td>
                      <td>{link.clicks}</td>
                      <td>{link.conversions}</td>
                      <td>{money.format(link.revenuePaise / 100)}</td>
                      <td>{money.format(link.commissionPaise / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </PageContainer>
  );
}
