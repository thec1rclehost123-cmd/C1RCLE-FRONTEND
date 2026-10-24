import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { ConnectedEventEditScreen } from '@/components/partner-v3/event-detail/ConnectedEventEditScreen';
import { loadPartnerEvent } from '@/lib/events/load-partner-event';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';

export default async function StudioEventEditPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const cookieHeader = (await cookies()).toString();
  const organizationId = getActiveOrgIdFromCookieHeader(cookieHeader);
  const event = await loadPartnerEvent(eventId);
  if (!organizationId) notFound();
  return <ConnectedEventEditScreen event={event} organizationId={organizationId} studio={studio} />;
}
