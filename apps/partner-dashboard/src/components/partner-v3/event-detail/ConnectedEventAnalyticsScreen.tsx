import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import type { EventAnalyticsDto } from '@c1rcle/contracts';

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(paise: number): string {
  return rupees.format(paise / 100);
}

function percentage(ratio: number | null): string {
  return ratio === null ? '—' : `${String(Math.round(ratio * 100))}%`;
}

interface Metric {
  readonly label: string;
  readonly value: string;
}

/**
 * A direct rendering of the existing event analytics projection. It deliberately
 * does not infer funnel stages, demographics, or comparison periods: those are
 * not supplied by this event-level contract.
 */
export function ConnectedEventAnalyticsScreen({
  analytics,
  studio,
}: {
  readonly analytics: EventAnalyticsDto;
  readonly studio: 'host' | 'venue';
}) {
  const metrics: readonly Metric[] = [
    { label: 'Gross amount paid', value: money(analytics.totalRevenuePaise) },
    { label: 'Tickets sold', value: analytics.ticketsSold.toLocaleString('en-IN') },
    {
      label: 'Ticket inventory',
      value: analytics.totalTicketInventory.toLocaleString('en-IN'),
    },
    { label: 'Check-ins', value: analytics.totalCheckIns.toLocaleString('en-IN') },
    {
      label: 'Room capacity',
      value: analytics.capacity?.toLocaleString('en-IN') ?? 'Not configured',
    },
    { label: 'Views', value: analytics.views.toLocaleString('en-IN') },
    { label: 'Guestlist sign-ups', value: analytics.guestlistSignups.toLocaleString('en-IN') },
    { label: 'Average amount paid per ticket', value: money(analytics.avgTicketPricePaise) },
    { label: 'Occupancy', value: percentage(analytics.occupancyRate) },
    { label: 'Sell-through', value: percentage(analytics.sellThroughRate) },
    { label: 'Refunded', value: money(analytics.refundAmountPaise) },
    { label: 'Refund rate', value: percentage(analytics.refundRate) },
    { label: 'No-show rate', value: percentage(analytics.noShowRate) },
    { label: 'Repeat guests', value: analytics.repeatGuests.toLocaleString('en-IN') },
    { label: 'Conversion', value: percentage(analytics.conversionRate) },
  ];

  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/events/${encodeURIComponent(analytics.eventId)}`}
          className="text-sm font-medium text-stone-400 no-underline hover:text-stone-100"
        >
          ← Event details
        </Link>
        <section
          aria-labelledby="event-analytics-title"
          className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-7"
        >
          <h1 id="event-analytics-title" className="mb-2 text-3xl font-bold tracking-tight">
            Event analytics
          </h1>
          <p className="m-0 leading-6 text-stone-300">
            Current event totals from the connected analytics projection.
          </p>
          <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-white/15 p-4">
                <dt className="text-sm text-stone-400">{metric.label}</dt>
                <dd className="mt-1.5 text-xl font-semibold">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </PageContainer>
  );
}
