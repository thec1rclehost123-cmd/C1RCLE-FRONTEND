import { notFound } from 'next/navigation';

import { SlotRequestScreen } from '@/components/partner-v3/slot-requests/SlotRequestScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import type { SlotRequestScreenProps } from '@/components/partner-v3/slot-requests/SlotRequestScreen';

export default async function StudioSlotRequestsPage({ params, searchParams }: { readonly params: Promise<{ studio: string }>; readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const query = await searchParams;
  const getValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const view: SlotRequestScreenProps['initialView'] = getValue(query['status']) === 'all' ? 'all' : 'pending';
  const panel: SlotRequestScreenProps['initialPanel'] = getValue(query['panel']) === 'preview' ? 'preview' : 'details';
  const previewMode: SlotRequestScreenProps['initialPreviewMode'] = getValue(query['preview']) === 'mobile' ? 'mobile' : 'guest';
  const data = studio === 'venue'
    ? await fixturePartnerDataSource.getVenueSlotRequests()
    : await fixturePartnerDataSource.getHostSlotRequests();
  const requestId = getValue(query['request']);
  return <SlotRequestScreen data={data} initialView={view} {...(requestId ? { initialRequestId: requestId } : {})} initialPanel={panel} initialPreviewMode={previewMode} />;
}
