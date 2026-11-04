import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { HostEventEditorRoute } from '@/components/partner-v3/event-editor/HostEventEditorRoute';
import { VenueEventEditorRoute } from '@/components/partner-v3/event-editor/VenueEventEditorRoute';
import { createEmptyEventEditorData } from '@/lib/events/event-editor-data';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

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
  const step = value(query['step']);
  const venue = value(query['venue']);
  const date = value(query['date']);
  const slot = value(query['slot']);
  const request = value(query['request']);
  if (studio === 'venue') {
    const organizationId = getActiveOrgIdFromCookieHeader((await cookies()).toString());
    const data = createEmptyEventEditorData('venue');
    return (
      <VenueEventEditorRoute
        organizationId={organizationId}
        data={data}
        {...(step ? { initialStep: step } : {})}
        {...(venue ? { initialVenueId: venue } : {})}
        {...(date ? { initialDate: date } : {})}
        {...(slot ? { initialSlotId: slot } : {})}
      />
    );
  }
  const data = createEmptyEventEditorData('host');
  const organizationId = getActiveOrgIdFromCookieHeader((await cookies()).toString());
  return (
    <HostEventEditorRoute
      organizationId={organizationId}
      data={data}
      {...(step ? { initialStep: step } : {})}
      {...(venue ? { initialVenueId: venue } : {})}
      {...(date ? { initialDate: date } : {})}
      {...(slot ? { initialSlotId: slot } : {})}
      {...(request ? { acceptedRequestId: request } : {})}
    />
  );
}
