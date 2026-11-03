import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import type { TicketTierDto } from '@c1rcle/contracts';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export function ConnectedEventTicketsScreen({
  tiers,
}: {
  readonly tiers: readonly TicketTierDto[];
}) {
  return (
    <PageContainer>
      <main className="mx-auto max-w-6xl py-7 text-stone-100">
        <section className="rounded-2xl border border-white/10 bg-[#111113] p-5 sm:p-7">
          <header className="mb-3">
            <h1 className="text-2xl font-bold">Tickets</h1>
          </header>
          {tiers.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">
              No ticket types are available for this event.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-stone-400">
                  <tr>
                    <th className="py-3 pr-4">Ticket type</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Price</th>
                    <th className="py-3 pr-4">Inventory</th>
                    <th className="py-3">Max per order</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <tr key={tier.id} className="border-b border-white/[0.06] last:border-0">
                      <th scope="row" className="py-4 pr-4 font-semibold text-white">
                        <span>{tier.name}</span>
                        {tier.description ? (
                          <span className="mt-1 block max-w-sm font-normal text-stone-400">
                            {tier.description}
                          </span>
                        ) : null}
                      </th>
                      <td className="py-4 pr-4 capitalize text-stone-300">
                        {tier.status.replaceAll('_', ' ')}
                      </td>
                      <td className="py-4 pr-4 tabular-nums">
                        {tier.priceInPaise === 0 ? 'Free' : money.format(tier.priceInPaise / 100)}
                      </td>
                      <td className="py-4 pr-4 text-stone-300">
                        {tier.quantity.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 text-stone-300">{tier.maxPerOrder ?? 'Not set'}</td>
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
