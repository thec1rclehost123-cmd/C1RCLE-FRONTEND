import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import type { FinanceOrderDto } from '@c1rcle/contracts';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export function ConnectedEventSalesScreen({
  studio,
  eventId,
  eventTitle,
  orders,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly eventTitle: string;
  readonly orders: readonly FinanceOrderDto[];
}) {
  const paid = orders.filter((order) => order.status === 'paid');
  const total = paid.reduce((sum, order) => sum + order.grandTotalPaise, 0);
  const tickets = paid.reduce((sum, order) => sum + order.ticketCount, 0);

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
          <h1 className="text-3xl font-bold">Sales</h1>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-stone-400">Paid orders</dt>
              <dd className="text-2xl font-semibold">{paid.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-stone-400">Tickets sold</dt>
              <dd className="text-2xl font-semibold">{tickets}</dd>
            </div>
            <div>
              <dt className="text-sm text-stone-400">Gross collected</dt>
              <dd className="text-2xl font-semibold">{money.format(total / 100)}</dd>
            </div>
          </dl>
          {orders.length === 0 ? (
            <p className="mt-8 text-stone-400">No orders are recorded for this event.</p>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/15 text-stone-400">
                  <tr>
                    <th className="py-3">Buyer</th>
                    <th>Tickets</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-white/10">
                      <td className="py-3">{order.buyerName}</td>
                      <td>{order.ticketCount}</td>
                      <td>{money.format(order.grandTotalPaise / 100)}</td>
                      <td>{order.status}</td>
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
