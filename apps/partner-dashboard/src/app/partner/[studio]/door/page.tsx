import { notFound } from 'next/navigation';

import { PartnerDoorSelectionScreen } from '@/components/partner-v3/door/PartnerDoorSelectionScreen';
import { loadPartnerEvents } from '@/lib/events/load-partner-events';

async function loadVenueEvents(cursor?: string) {
  try {
    return await loadPartnerEvents({ studio: 'venue', cursor });
  } catch (cause) {
    if (typeof cause === 'object' && cause !== null && 'digest' in cause) throw cause;
    return null;
  }
}

export default async function StudioDoorPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (studio !== 'venue') notFound();
  const query = await searchParams;
  const cursor = Array.isArray(query['cursor']) ? query['cursor'][0] : query['cursor'];
  const data = await loadVenueEvents(cursor);
  return <PartnerDoorSelectionScreen data={data} />;
}
