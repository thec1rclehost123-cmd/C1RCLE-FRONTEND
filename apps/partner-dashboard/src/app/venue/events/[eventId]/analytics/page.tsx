import { VenueEventAnalyticsScreen } from '@/components/venue/screens/VenueEventAnalyticsScreen';

import type { AnalyticsTab } from '@/components/venue/screens/VenueEventAnalyticsScreen';

const validTabs: readonly AnalyticsTab[] = ['overview', 'sales', 'audience', 'attribution', 'entry', 'finance'];

export default async function VenueEventAnalyticsPage({ params, searchParams }: { readonly params: Promise<{ eventId: string }>; readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { eventId } = await params;
  const resolvedSearchParams = await searchParams;
  const requested = resolvedSearchParams['tab'];
  const requestedRange = resolvedSearchParams['range'];
  const tab = typeof requested === 'string' && validTabs.includes(requested as AnalyticsTab) ? requested as AnalyticsTab : 'overview';
  const range = requestedRange === '7d' || requestedRange === '90d' ? requestedRange : '30d';
  return <VenueEventAnalyticsScreen activeTab={tab} eventId={eventId} range={range} />;
}
