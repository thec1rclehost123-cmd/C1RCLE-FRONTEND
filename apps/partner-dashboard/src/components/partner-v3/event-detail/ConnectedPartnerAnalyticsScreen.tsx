import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import type { PartnerOrganizationAnalytics } from '@/lib/events/load-partner-organization-analytics';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const date = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' });

function formatMoney(paise: number): string {
  return money.format(paise / 100);
}

export function ConnectedPartnerAnalyticsScreen({
  analytics,
  studio,
}: {
  readonly analytics: PartnerOrganizationAnalytics;
  readonly studio: 'host' | 'venue';
}) {
  const { overview, lastThirtyDays } = analytics;
  const windowTotals = lastThirtyDays.totals;
  const metrics = [
    ['Total tickets issued', analytics.salesBreakdown.totalTicketsIssued.toLocaleString('en-IN')],
    ['Paid tickets', analytics.salesBreakdown.paidTickets.toLocaleString('en-IN')],
    ['Free RSVP tickets', analytics.salesBreakdown.freeRsvpTickets.toLocaleString('en-IN')],
    ['Paid orders', analytics.salesBreakdown.paidOrderCount.toLocaleString('en-IN')],
    ['Guest gross collected', formatMoney(analytics.salesBreakdown.guestGrossCollectedPaise)],
    ['Ticket revenue', formatMoney(analytics.salesBreakdown.ticketRevenuePaise)],
    ['Check-ins', overview.totalCheckIns.toLocaleString('en-IN')],
    ['Published events', overview.publishedEvents.toLocaleString('en-IN')],
  ] as const;

  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/overview`}
          className="text-sm font-medium text-stone-400 no-underline hover:text-stone-100"
        >
          ← Overview
        </Link>
        <section className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-7">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-2 text-stone-300">
            Organization-wide ticket and collection totals, with Partner payable kept separate.
          </p>
          <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/15 p-4">
                <dt className="text-sm text-stone-400">{label}</dt>
                <dd className="mt-1.5 text-xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 rounded-xl border border-white/15 p-4">
            <h2 className="text-base font-semibold">Partner payable</h2>
            <p className="mt-1 text-sm text-stone-400">
              Lifetime payable is not Guest gross collected. Values use the{' '}
              {analytics.partnerPayable.readModel === 'financial_journal_v2'
                ? 'financial journal'
                : 'legacy ledger'}{' '}
              read model.
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Lifetime payable', analytics.partnerPayable.lifetimePaise],
                ['Available', analytics.partnerPayable.availablePaise],
                ['Pending settlement', analytics.partnerPayable.pendingPaise],
                ['Reserved for payout', analytics.partnerPayable.reservedPaise],
                ['Held', analytics.partnerPayable.heldPaise],
                ['Paid out', analytics.partnerPayable.paidPaise],
              ].map(([label, amount]) => (
                <div key={label}>
                  <dt className="text-sm text-stone-400">{label}</dt>
                  <dd className="text-lg font-semibold">{formatMoney(Number(amount))}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-4 text-sm text-stone-400">
            Guest gross includes platform fees and GST and is before refunds. Ticket revenue is the
            discounted ticket subtotal, excludes fees and GST, and is before refunds. Total tickets
            issued is historical and includes tickets later voided or refunded.
          </p>
        </section>

        <section className="mt-5 rounded-2xl border border-white/15 bg-neutral-950 p-7">
          <h2 className="text-xl font-semibold">Last 30 days</h2>
          <p className="mt-1 text-sm text-stone-400">
            Window totals are separate from lifetime totals and are not combined.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-stone-400">Guest gross collected</dt>
              <dd className="text-lg font-semibold">
                {formatMoney(windowTotals.guestGrossCollectedPaise)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-stone-400">Ticket revenue</dt>
              <dd className="text-lg font-semibold">
                {formatMoney(windowTotals.ticketRevenuePaise)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-stone-400">Tickets issued</dt>
              <dd className="text-lg font-semibold">
                {windowTotals.totalTicketsIssued.toLocaleString('en-IN')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-stone-400">Paid tickets / free RSVPs</dt>
              <dd className="text-lg font-semibold">
                {windowTotals.paidTickets.toLocaleString('en-IN')} /{' '}
                {windowTotals.freeRsvpTickets.toLocaleString('en-IN')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-stone-400">Paid orders</dt>
              <dd className="text-lg font-semibold">
                {windowTotals.paidOrderCount.toLocaleString('en-IN')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-stone-400">Net captured after refunds</dt>
              <dd className="text-lg font-semibold">{formatMoney(windowTotals.revenuePaise)}</dd>
            </div>
            <div>
              <dt className="text-sm text-stone-400">Check-ins</dt>
              <dd className="text-lg font-semibold">
                {windowTotals.checkIns.toLocaleString('en-IN')}
              </dd>
            </div>
          </dl>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/15 text-stone-400">
                <tr>
                  <th className="py-3">Day</th>
                  <th>Guest gross</th>
                  <th>Ticket revenue</th>
                  <th>Issued</th>
                  <th>Paid / RSVP</th>
                  <th>Paid orders</th>
                  <th>Net after refunds</th>
                  <th>Check-ins</th>
                </tr>
              </thead>
              <tbody>
                {lastThirtyDays.buckets.map((bucket) => (
                  <tr key={bucket.key} className="border-b border-white/10">
                    <td className="py-3">{bucket.key}</td>
                    <td>{formatMoney(bucket.guestGrossCollectedPaise)}</td>
                    <td>{formatMoney(bucket.ticketRevenuePaise)}</td>
                    <td>{bucket.totalTicketsIssued}</td>
                    <td>
                      {bucket.paidTickets} / {bucket.freeRsvpTickets}
                    </td>
                    <td>{bucket.paidOrderCount}</td>
                    <td>{formatMoney(bucket.revenuePaise)}</td>
                    <td>{bucket.checkIns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-white/15 bg-neutral-950 p-7">
          <h2 className="text-xl font-semibold">Top events</h2>
          {overview.topEvents.length === 0 ? (
            <p className="mt-5 text-stone-400">No completed event sales are recorded yet.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/15 text-stone-400">
                  <tr>
                    <th className="py-3">Event</th>
                    <th>Net captured after refunds</th>
                    <th>Ticket units</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.topEvents.map((event) => (
                    <tr key={event.eventId} className="border-b border-white/10">
                      <td className="py-3">{event.title}</td>
                      <td>{formatMoney(event.revenuePaise)}</td>
                      <td>{event.tickets}</td>
                      <td>{date.format(new Date(event.date))}</td>
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
