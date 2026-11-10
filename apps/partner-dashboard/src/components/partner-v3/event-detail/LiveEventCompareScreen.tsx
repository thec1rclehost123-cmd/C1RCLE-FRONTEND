import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { formatPaise } from '@/lib/finance/finance-view-model';

import type { EventComparisonResponse } from '@c1rcle/contracts';

export function LiveEventCompareScreen({ data }: { readonly data: EventComparisonResponse }) {
  const rows = [
    ['Money made', (item: EventComparisonResponse['current']) => formatPaise(item.analytics.totalRevenuePaise)],
    ['Tickets sold', (item: EventComparisonResponse['current']) => String(item.analytics.ticketsSold)],
    ['Refunds', (item: EventComparisonResponse['current']) => formatPaise(item.analytics.refundAmountPaise)],
    ['Checked in', (item: EventComparisonResponse['current']) => String(item.analytics.totalCheckIns)],
    ['Sell through', (item: EventComparisonResponse['current']) => item.analytics.sellThroughRate === null ? '—' : `${Math.round(item.analytics.sellThroughRate * 100).toFixed(0)}%`],
  ] as const;
  const columns = [data.current, ...data.previous];
  return (
    <PageContainer>
      <main className="mx-auto max-w-6xl py-7 text-stone-100">
        <h1 className="text-2xl font-bold">Live compare</h1>
        <p className="mt-1 text-sm text-stone-400">Compare this event’s current totals with final totals from recent completed events at the same venue.</p>
        {data.previous.length === 0 ? <section className="mt-6 rounded-2xl border border-white/10 bg-neutral-950 p-6" aria-label="No comparable events">
          <h2 className="text-lg font-semibold">No completed events to compare yet</h2>
          <p className="mt-2 text-sm text-stone-400">Once another event at this venue is completed, its final totals will appear here.</p>
        </section> : <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-neutral-950">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-white/10"><th className="p-4">Metric</th>{columns.map((event) => <th className="p-4" key={event.eventId}>
              <span className="block font-semibold">{event.title}</span><span className="mt-1 block text-xs text-stone-400">{event.status === 'current' ? 'Current totals' : 'Final totals'} · {new Date(event.startAt).toLocaleDateString()}</span>
            </th>)}</tr></thead>
            <tbody>{rows.map(([label, value]) => <tr className="border-b border-white/5 last:border-0" key={label}><th className="p-4 font-medium text-stone-300">{label}</th>{columns.map((event) => <td className="p-4 tabular-nums" key={event.eventId}>{value(event)}</td>)}</tr>)}</tbody>
          </table>
        </div>}
      </main>
    </PageContainer>
  );
}
