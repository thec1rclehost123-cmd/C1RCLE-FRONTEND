import { notFound } from 'next/navigation';

import { EventDetailLayout } from '@/components/venue/event-detail/EventDetailLayout';
import { getVenueEventDetailRecord } from '@/components/venue/event-detail-model';

import type { ReactNode } from 'react';

export default async function VenueEventDetailLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const record = getVenueEventDetailRecord(eventId);
  if (!record) notFound();

  return <EventDetailLayout event={record.header}>{children}</EventDetailLayout>;
}
