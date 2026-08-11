import { DashboardPageHeader, MetricCard, SectionHeading, StatusBadge } from '@/components/partner-shell/DashboardUi';
import { formatInr } from '@/lib/partner/contracts';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function PromoterFinancePage() {
  const [finance, links] = await Promise.all([partnerRepositories.promoter.getFinance(), partnerRepositories.promoter.getLinks()]);
  return (
    <>
      <DashboardPageHeader eyebrow="Private workspace" title="Finance" description="Your commissions, settlements and payout account. These amounts are visible only to your promoter workspace." actions={<button type="button" className="pd-button pd-button--primary" disabled title="Payout requests require the finance mutation API">Request payout</button>} />
      <section className="pd-metrics">
        <MetricCard label="Available" value={formatInr(finance.availablePaise)} detail="eligible for payout" tone="positive" />
        <MetricCard label="Pending" value={formatInr(finance.pendingPaise)} detail="awaiting event settlement" tone="warning" />
        <MetricCard label="Lifetime earnings" value={formatInr(finance.lifetimePaise)} detail="private to you" tone="accent" />
        <MetricCard label="Next payout" value={finance.nextPayout} detail={finance.payoutAccount} />
      </section>
      <section className="pd-surface promoter-finance-table">
        <SectionHeading title="Campaign earnings" description="Private commission totals by tracked campaign." />
        <div className="promoter-table-scroll"><table><thead><tr><th>Campaign</th><th>Channel</th><th>Status</th><th>Purchases</th><th>Earnings</th></tr></thead><tbody>{links.map((link) => <tr key={link.id}><td><strong>{link.eventName}</strong><small>{link.label}</small></td><td>{link.channel}</td><td><StatusBadge tone={link.status === 'active' ? 'positive' : 'neutral'}>{link.status}</StatusBadge></td><td>{link.purchases}</td><td><strong>{formatInr(link.earningsPaise)}</strong></td></tr>)}</tbody></table></div>
      </section>
      <section className="promoter-finance-notice"><strong>Financial privacy</strong><p>No finance totals appear on your Partner Network performance profile. Venues and hosts see ticket movement and collaboration stats only.</p></section>
      <section className="promoter-finance-detail-grid">
        <article className="pd-surface promoter-payout-history"><SectionHeading title="Payout history" description={`${finance.kycStatus === 'verified' ? 'KYC verified' : 'KYC action required'} · ${finance.payoutAccount}`} /><div>{finance.payouts.map((payout) => <div key={payout.id}><span><strong>{payout.date}</strong><small>{payout.id}</small></span><strong>{formatInr(payout.amountPaise)}</strong><StatusBadge tone={payout.status === 'paid' ? 'positive' : payout.status === 'failed' ? 'danger' : 'warning'}>{payout.status}</StatusBadge></div>)}</div></article>
        <article className="pd-surface promoter-adjustments"><SectionHeading title="Adjustments" description="Refund reversals and campaign bonuses before final payout." /><div>{finance.adjustments.map((adjustment) => <div key={adjustment.id}><span><strong>{adjustment.eventName}</strong><small>{adjustment.date} · {adjustment.label}</small></span><strong className={adjustment.amountPaise < 0 ? 'is-negative' : 'is-positive'}>{formatInr(adjustment.amountPaise)}</strong></div>)}</div></article>
      </section>
    </>
  );
}
