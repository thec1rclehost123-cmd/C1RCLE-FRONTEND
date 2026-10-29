import Link from 'next/link';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import type { PromoterCampaignSummaryDto } from '@c1rcle/contracts';

const inr = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

export function PromoterAnalyticsConnected({
  summary,
}: {
  readonly summary: PromoterCampaignSummaryDto;
}) {
  return (
    <PageContainer>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 text-white sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Promoter workspace</p>
            <h1 className="mt-2 text-3xl font-semibold">Campaign analytics</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Referral activity from the backend campaign read model. Ticket value is gross and does
              not represent net commission or payout balance.
            </p>
          </div>
          <Link
            href="/partner/promoter/events"
            className="rounded-full border border-white/20 px-4 py-2 text-sm"
          >
            View campaigns
          </Link>
        </header>

        <section className="mt-8" aria-labelledby="campaign-summary-title">
          <h2 id="campaign-summary-title" className="text-lg font-medium">
            All campaigns
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Referral links counted" value={String(summary.linkCount)} />
            <Metric label="Clicks" value={String(summary.clicks)} />
            <Metric label="Conversions" value={String(summary.conversions)} />
            <Metric
              label="Gross attributed ticket value"
              value={inr(summary.grossAttributedTicketRevenuePaise)}
            />
          </dl>
          {summary.hasMoreLinks ? (
            <p className="mt-3 text-xs text-white/55">
              Totals include the first 1,000 referral links. Additional links are not included.
            </p>
          ) : null}
          <p className="mt-2 text-xs text-white/55">
            Revenue reflects referral-link counters before refund adjustments. For current pending,
            held, and available commission, see the Promoter overview.
          </p>
        </section>

        <section
          className="mt-8 rounded-2xl border border-white/10 p-5"
          aria-labelledby="timeline-title"
        >
          <h2 id="timeline-title" className="font-medium">
            Timeline
          </h2>
          <p className="mt-2 text-sm text-white/60">
            A daily breakdown is not available from the current backend read model. These totals
            show the data the service provides without estimating a timeline.
          </p>
        </section>
      </main>
    </PageContainer>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <dt className="text-xs text-white/55">{label}</dt>
      <dd className="mt-2 text-lg font-semibold">{value}</dd>
    </div>
  );
}
