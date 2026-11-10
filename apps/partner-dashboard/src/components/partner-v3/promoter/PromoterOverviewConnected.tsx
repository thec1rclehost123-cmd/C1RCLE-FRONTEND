import Link from 'next/link';

import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import type { loadPromoterOverview } from '@/lib/events/load-promoter-overview';

const inr = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
const dateTime = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: PRODUCT_TIME_ZONE,
  }).format(new Date(value));

type Overview = Awaited<ReturnType<typeof loadPromoterOverview>>;

export function PromoterOverviewConnected({ data }: { data: Overview }) {
  const activity = data.campaignSummary;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 text-white sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Promoter workspace</p>
          <h1 className="mt-2 text-3xl font-semibold">Campaign performance</h1>
          <p className="mt-2 text-sm text-white/60">
            Acquisition totals come from attributed orders; commission balances come from finance.
          </p>
        </div>
        <Link
          href="/partner/promoter/events"
          className="rounded-full border border-white/20 px-4 py-2 text-sm"
        >
          View campaigns
        </Link>
      </header>

      <section className="mt-8" aria-labelledby="referral-metrics-title">
        <h2 id="referral-metrics-title" className="text-lg font-medium">
          Referral activity
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Metric label="Clicks" value={String(activity.clicks)} />
          <Metric label="Conversions" value={String(activity.conversions)} />
          <Metric
            label="Gross attributed sales"
            value={inr(activity.grossAttributedTicketSalesPaise)}
            tone={activity.grossAttributedTicketSalesPaise > 0 ? 'positive' : 'neutral'}
          />
          <Metric label="Refunded value" value={inr(activity.refundedAttributedTicketSalesPaise)} tone={activity.refundedAttributedTicketSalesPaise > 0 ? 'negative' : 'neutral'} />
          <Metric
            label="Net attributed sales"
            value={inr(activity.netAttributedTicketSalesPaise)}
            tone={activity.netAttributedTicketSalesPaise > 0 ? 'positive' : 'neutral'}
          />
          <Metric
            label="RSVPs"
            value={`${String(activity.activeRsvpCount)} active · ${String(activity.historicalRsvpConversions)} historical`}
          />
        </dl>
        {activity.hasMoreLinks ? (
          <p className="mt-3 text-xs text-white/55">
            Click totals cover the first 1,000 referral links. Additional links are not included.
          </p>
        ) : null}
        <p className="mt-2 text-xs text-white/55">
          Conversions preserve historical acquisitions. Net sales subtract settled attributed
          refunds. Commission balances below come from the authoritative finance read model.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="commission-balance-title">
        <h2 id="commission-balance-title" className="text-lg font-medium">
          Commission balance
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Pending" value={inr(data.balance.pendingPaise)} />
          <Metric label="Held" value={inr(data.balance.heldPaise)} />
          <Metric label="Available" value={inr(data.balance.availablePaise)} tone={data.balance.availablePaise > 0 ? 'positive' : 'neutral'} />
          <Metric label="Paid" value={inr(data.balance.paidPaise)} tone={data.balance.paidPaise > 0 ? 'positive' : 'neutral'} />
        </dl>
        <p className="mt-3 text-xs text-white/55">
          Balance source: {data.balance.readModel}. M4 does not enable live payouts.
        </p>
        {data.ledger.hasNextPage ? (
          <p className="mt-2 text-xs text-white/55">
            The ledger read is bounded to 100 rows; older entries are not loaded.
          </p>
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="active-campaigns-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="active-campaigns-title" className="text-lg font-medium">
            Accepted campaigns
          </h2>
          <Link href="/partner/promoter/events?tab=invitations" className="text-sm underline">
            Review invitations
          </Link>
        </div>
        {data.events.linkedEvents.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/10 p-5 text-sm text-white/60">
            No accepted campaigns are currently connected.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10">
            {data.events.linkedEvents.map((event) => (
              <li
                key={event.assignmentId ?? event.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">{event.name}</p>
                  <p className="mt-1 text-xs text-white/55">
                    {event.clicks ?? 0} clicks · {event.sales ?? 0} conversions ·{' '}
                    {event.commissionLabel}
                  </p>
                </div>
                <Link
                  href={`/partner/promoter/events/${encodeURIComponent(event.id)}`}
                  className="text-sm underline"
                >
                  Open campaign
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="commission-ledger-title">
        <h2 id="commission-ledger-title" className="text-lg font-medium">
          Commission activity
        </h2>
        {data.ledger.items.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/10 p-5 text-sm text-white/60">
            No commission ledger activity is recorded.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10">
            {data.ledger.items.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {entry.entryType === 'refund' ? 'Commission reversal' : 'Promoter commission'}
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    {entry.status} · {dateTime(entry.createdAt)}
                  </p>
                </div>
                <p className={`font-semibold ${entry.entryType === 'refund' ? 'text-rose-400' : 'text-emerald-400'}`}>{inr(entry.amountPaise)}</p>
              </li>
            ))}
          </ul>
        )}
        {data.ledger.hasNextPage ? (
          <p className="mt-2 text-xs text-white/55">
            Commission activity shows the latest 100 ledger entries.
          </p>
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="attributed-orders-title">
        <h2 id="attributed-orders-title" className="text-lg font-medium">
          Attributed orders
        </h2>
        {data.attributedOrders.items.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/10 p-5 text-sm text-white/60">
            No attributed orders are recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[680px] divide-y divide-white/10 text-left text-sm">
              <thead className="text-xs text-white/55">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Booking reference
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Event
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Tickets
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Ticket value
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Commission
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Attributed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.attributedOrders.items.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-mono text-xs">
                      {order.bookingReference ?? order.id}
                    </td>
                    <td className="px-4 py-3">
                      {data.events.linkedEvents.find((event) => event.id === order.eventId)?.name ??
                        order.eventId}
                    </td>
                    <td className="px-4 py-3">{order.status.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-3 text-right">{order.ticketCount}</td>
                    <td className={`px-4 py-3 text-right ${order.status === 'refunded' ? 'text-rose-400' : order.status === 'paid' ? 'text-emerald-400' : ''}`}>
                      {inr(order.attributedTicketValuePaise)}
                    </td>
                    <td className={`px-4 py-3 text-right ${order.status === 'refunded' ? 'text-rose-400' : order.status === 'paid' ? 'text-emerald-400' : ''}`}>{inr(order.promoterCommissionPaise)}</td>
                    <td className="px-4 py-3 text-xs text-white/55">
                      {dateTime(order.attributedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.attributedOrders.pageInfo.hasNextPage ? (
          <p className="mt-2 text-xs text-white/55">
            Showing one page of up to 100 attributed orders. Additional pages are available.
          </p>
        ) : null}
        <p className="mt-2 text-xs text-white/55">
          Guest contact details, payment identifiers, referral codes, and attribution signatures are
          not shown.
        </p>
      </section>
    </main>
  );
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'positive' | 'negative' | 'neutral' }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <dt className="text-xs text-white/55">{label}</dt>
      <dd className={`mt-2 text-lg font-semibold ${tone === 'positive' ? 'text-emerald-400' : tone === 'negative' ? 'text-rose-400' : 'text-white'}`}>{value}</dd>
    </div>
  );
}
