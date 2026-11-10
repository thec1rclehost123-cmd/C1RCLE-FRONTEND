import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import type { EventAnalyticsDto } from '@c1rcle/contracts';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function ConnectedEventRevenueScreen({
  analytics,
}: {
  readonly analytics: EventAnalyticsDto;
}) {
  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl py-7 text-stone-100">
        <h1 className="text-2xl font-bold">Revenue</h1>
        <p className="mt-1 text-sm text-stone-400">Event totals from the connected sales record.</p>
        <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label="Revenue summary">
          <article className="rounded-2xl border border-white/10 bg-neutral-950 p-6">
            <p className="text-sm text-stone-400">Gross amount paid</p>
            <strong className="mt-3 block text-3xl font-bold tabular-nums">
              {money.format(analytics.totalRevenuePaise / 100)}
            </strong>
          </article>
          <article className="rounded-2xl border border-white/10 bg-neutral-950 p-6">
            <p className="text-sm text-stone-400">Refunded</p>
            <strong className="mt-3 block text-3xl font-bold tabular-nums text-red-300">
              {money.format(analytics.refundAmountPaise / 100)}
            </strong>
          </article>
        </section>
        <dl className="mt-4 grid gap-4 rounded-2xl border border-white/10 bg-neutral-950 p-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-stone-400">Average paid per ticket</dt>
            <dd className="mt-2 font-semibold tabular-nums">
              {money.format(analytics.avgTicketPricePaise / 100)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-400">Refund rate</dt>
            <dd className="mt-2 font-semibold tabular-nums text-red-300">
              {Math.round(analytics.refundRate * 100)}%
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-400">Tickets sold</dt>
            <dd className="mt-2 font-semibold tabular-nums">
              {analytics.ticketsSold.toLocaleString('en-IN')}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-stone-500">
          These are event-level totals; they do not include a line-by-line order breakdown.
        </p>
      </main>
    </PageContainer>
  );
}
