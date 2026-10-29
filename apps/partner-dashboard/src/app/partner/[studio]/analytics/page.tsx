import Link from 'next/link';

import { ConnectedPartnerAnalyticsScreen } from '@/components/partner-v3/event-detail/ConnectedPartnerAnalyticsScreen';
import { PromoterAnalyticsConnected } from '@/components/partner-v3/promoter/PromoterAnalyticsConnected';
import { loadPartnerOrganizationAnalytics } from '@/lib/events/load-partner-organization-analytics';
import { loadPromoterCampaignSummary } from '@/lib/events/load-promoter-campaign-summary';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioAnalyticsPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio === 'promoter') {
    let summary: Awaited<ReturnType<typeof loadPromoterCampaignSummary>>;
    try {
      summary = await loadPromoterCampaignSummary();
    } catch {
      return (
        <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-start justify-center px-6 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Promoter workspace</p>
          <h1 className="mt-3 text-2xl font-semibold">Analytics unavailable</h1>
          <p className="mt-3 text-sm text-white/65">
            Campaign totals could not be loaded. Retry to check the current backend data.
          </p>
          <Link className="mt-5 underline" href="/partner/promoter/analytics">
            Try again
          </Link>
        </section>
      );
    }
    return <PromoterAnalyticsConnected summary={summary} />;
  }
  if (studio !== 'venue' && studio !== 'host') {
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Analytics',
      'Analytics are unavailable for this workspace.',
    );
  }
  const analytics = await loadPartnerOrganizationAnalytics();
  return <ConnectedPartnerAnalyticsScreen analytics={analytics} studio={studio} />;
}
