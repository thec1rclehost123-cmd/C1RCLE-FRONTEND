import { DashboardPageHeader, SectionHeading, StatusBadge } from '@/components/partner-shell/DashboardUi';
import { PromoterLinkBuilder } from '@/components/promoter/PromoterLinkBuilder';
import { CopyLinkButton } from '@/components/promoter/PromoterShareActions';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function PromoterLinksPage() {
  const links = await partnerRepositories.promoter.getLinks();
  return (
    <>
      <DashboardPageHeader eyebrow="Campaign attribution" title="Get link" description="Prepare event- and channel-specific tracking requests, then watch the clicks and tickets they move." />
      <PromoterLinkBuilder />
      <section className="pd-surface promoter-links-list">
        <SectionHeading title="Active tracked links" description="One purpose per link keeps attribution clear." />
        <div>{links.map((link) => <article key={link.id}><div><StatusBadge tone={link.status === 'active' ? 'positive' : 'neutral'}>{link.status}</StatusBadge><strong>{link.eventName}</strong><span>{link.channel} · {link.label}</span><small>{link.shortUrl}</small></div><dl><div><dt>{link.clicks.toLocaleString('en-IN')}</dt><dd>Clicks</dd></div><div><dt>{link.purchases}</dt><dd>Purchases</dd></div><div><dt>{link.clicks ? ((link.purchases / link.clicks) * 100).toFixed(1) : '0.0'}%</dt><dd>Conversion</dd></div></dl><CopyLinkButton value={`https://${link.shortUrl}`} /></article>)}</div>
      </section>
    </>
  );
}
