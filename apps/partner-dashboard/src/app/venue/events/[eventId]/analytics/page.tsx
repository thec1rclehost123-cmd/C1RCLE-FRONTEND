import { notFound } from 'next/navigation';

import { VenueEventAnalyticsScreen } from '@/components/venue/screens/VenueEventAnalyticsScreen';
import { getVenueEventAnalyticsModel } from '@/components/venue/venue-event-analytics-model';

import type { EventAnalyticsRange } from '@/components/venue/venue-event-analytics-model';

export default async function VenueEventAnalyticsPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ eventId: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const resolvedSearchParams = await searchParams;
  const requestedRange = resolvedSearchParams['range'];
  const range: EventAnalyticsRange =
    requestedRange === '30d' || requestedRange === '90d' ? requestedRange : '7d';
  const model = getVenueEventAnalyticsModel(eventId);
  if (!model) notFound();
  return <VenueEventAnalyticsScreen model={model} range={range} />;
}
