import { notFound } from 'next/navigation';

import { PartnerEventEditor } from '@/components/partner-v3/event-editor/PartnerEventEditor';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

export default async function StudioCreateEventPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const query = await searchParams;
  const value = (input: string | string[] | undefined) => (Array.isArray(input) ? input[0] : input);
  const data =
    studio === 'host'
      ? await fixturePartnerDataSource.getHostEventEditor()
      : await fixturePartnerDataSource.getVenueEventEditor();
  const availability =
    studio === 'host'
      ? await fixturePartnerDataSource.getHostAvailability()
      : await fixturePartnerDataSource.getVenueCalendar();
  const step = value(query['step']);
  const venue = value(query['venue']);
  const date = value(query['date']);
  const slot = value(query['slot']);
  return (
    <PartnerEventEditor
      data={data}
      availability={availability}
      mode="create"
      {...(step ? { initialStep: step } : {})}
      {...(venue ? { initialVenueId: venue } : {})}
      {...(date ? { initialDate: date } : {})}
      {...(slot ? { initialSlotId: slot } : {})}
    />
  );
}
