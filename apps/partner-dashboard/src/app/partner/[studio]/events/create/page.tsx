import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { HostEventEditorRoute } from '@/components/partner-v3/event-editor/HostEventEditorRoute';
import { VenueEventEditorRoute } from '@/components/partner-v3/event-editor/VenueEventEditorRoute';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';
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
  if (studio === 'venue') {
    const organizationId = getActiveOrgIdFromCookieHeader((await cookies()).toString());
    const data = await fixturePartnerDataSource.getVenueEventEditor();
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
  const data = await fixturePartnerDataSource.getHostEventEditor();
  const organizationId = getActiveOrgIdFromCookieHeader((await cookies()).toString());
  return (
    <HostEventEditorRoute
      organizationId={organizationId}
      data={data}
      {...(step ? { initialStep: step } : {})}
      {...(venue ? { initialVenueId: venue } : {})}
      {...(date ? { initialDate: date } : {})}
      {...(slot ? { initialSlotId: slot } : {})}
    />
  );
}
