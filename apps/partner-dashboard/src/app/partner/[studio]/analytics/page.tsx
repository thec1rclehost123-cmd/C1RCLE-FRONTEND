import { ConnectedPartnerAnalyticsScreen } from '@/components/partner-v3/event-detail/ConnectedPartnerAnalyticsScreen';
import { PromoterMetricsUnavailable } from '@/components/partner-v3/promoter/PromoterMetricsUnavailable';
import { loadPartnerOrganizationAnalytics } from '@/lib/events/load-partner-organization-analytics';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioAnalyticsPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio === 'promoter') return <PromoterMetricsUnavailable section="Analytics" />;
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
