import { notFound } from 'next/navigation';

import { conversionRate, formatInr, linkById } from '@/components/promoter/promoter-studio-model';
import { CopyLinkButton } from '@/components/promoter/PromoterStudioActions';
import {
  CanonicalLinkPanel,
  LineChart,
  MetricStrip,
  PromoterButton,
} from '@/components/promoter/PromoterStudioUi';

export default async function LinkPerformancePage({
  params,
}: {
  readonly params: Promise<{ linkId: string }>;
}) {
  const link = linkById((await params).linkId);
  if (!link) notFound();
  return (
    <div className="pr-page">
      <PromoterButton href="/promoter/links" tone="quiet">
        ← Back to links
      </PromoterButton>
      <CanonicalLinkPanel link={link} />
      <div className="pr-inline-actions">
        <CopyLinkButton value={`https://${link.url}`} />
      </div>
      <MetricStrip
        items={[
          { label: 'Clicks', value: link.clicks.toLocaleString('en-IN') },
          { label: 'Orders', value: link.orders.toLocaleString('en-IN') },
          {
            label: 'Conversion',
            value: `${conversionRate(link.orders, link.clicks).toString()}%`,
          },
          { label: 'Commission earned', value: formatInr(link.earnedPaise) },
        ]}
      />
      <LineChart
        title="Link performance"
        value={`${link.tickets.toString()} tickets`}
        values={[21, 34, 42, 65, 61, 83, 102]}
        labels={['10 Jul', '11 Jul', '12 Jul', '13 Jul', '14 Jul', '15 Jul', '16 Jul']}
      />
    </div>
  );
}
