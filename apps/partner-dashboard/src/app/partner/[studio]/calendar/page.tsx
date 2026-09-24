import { notFound } from 'next/navigation';

import { HostAvailabilityScreen } from '@/components/partner-v3/calendar/HostAvailabilityScreen';
import { VenueCalendarScreen } from '@/components/partner-v3/calendar/VenueCalendarScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

export default async function StudioCalendarPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const query = await searchParams;
  const getValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  if (studio === 'venue') {
    const data = await fixturePartnerDataSource.getVenueCalendar();
    const month = getValue(query['month']);
    const date = getValue(query['date']);
    return (
      <VenueCalendarScreen
        data={data}
        {...(month ? { initialMonth: month } : {})}
        {...(date ? { initialDate: date } : {})}
        initialDialog={getValue(query['dialog']) === 'block'}
      />
    );
  }
  const data = await fixturePartnerDataSource.getHostAvailability();
  const month = getValue(query['month']);
  const date = getValue(query['date']);
  const venue = getValue(query['venue']);
  const slot = getValue(query['slot']);
  return (
    <HostAvailabilityScreen
      data={data}
      {...(month ? { initialMonth: month } : {})}
      {...(date ? { initialDate: date } : {})}
      {...(venue ? { initialVenue: venue } : {})}
      {...(slot ? { initialSlot: slot } : {})}
    />
  );
}
