import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { HostAvailabilityRoute } from '@/components/partner-v3/calendar/HostAvailabilityRoute';
import { VenueCalendarRoute } from '@/components/partner-v3/calendar/VenueCalendarRoute';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

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
  const organizationId = getActiveOrgIdFromCookieHeader((await cookies()).toString());
  if (studio === 'venue') {
    const month = getValue(query['month']);
    const date = getValue(query['date']);
    return (
      <VenueCalendarRoute
        organizationId={organizationId}
        {...(month ? { initialMonth: month } : {})}
        {...(date ? { initialDate: date } : {})}
        initialDialog={getValue(query['dialog']) === 'block'}
      />
    );
  }
  const month = getValue(query['month']);
  const date = getValue(query['date']);
  const venue = getValue(query['venue']);
  const slot = getValue(query['slot']);
  return (
    <HostAvailabilityRoute
      organizationId={organizationId}
      {...(month ? { initialMonth: month } : {})}
      {...(date ? { initialDate: date } : {})}
      {...(venue ? { initialVenue: venue } : {})}
      {...(slot ? { initialSlot: slot } : {})}
    />
  );
}
