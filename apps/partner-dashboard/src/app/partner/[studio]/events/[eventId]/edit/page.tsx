import { notFound } from 'next/navigation';

import { PartnerEventEditor } from '@/components/partner-v3/event-editor/PartnerEventEditor';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';


export default async function StudioEventEditPage({ params, searchParams }: { readonly params: Promise<{ studio: string; eventId: string }>; readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const query = await searchParams;
  const value = (input: string | string[] | undefined) => Array.isArray(input) ? input[0] : input;
  const data = studio === 'host' ? await fixturePartnerDataSource.getHostEventEditor() : await fixturePartnerDataSource.getVenueEventEditor();
  const availability = studio === 'host' ? await fixturePartnerDataSource.getHostAvailability() : await fixturePartnerDataSource.getVenueCalendar();
  const event = studio === 'host' ? await fixturePartnerDataSource.getHostEventDetail(eventId) : await fixturePartnerDataSource.getVenueEventDetail(eventId);
  if (!event) notFound();
  const step = value(query['step']);
  return <PartnerEventEditor data={data} availability={availability} mode="edit" eventId={eventId} initialEvent={event} initialStep={step ?? 'basics'} />;
}
