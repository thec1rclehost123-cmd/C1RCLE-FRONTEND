import { notFound } from 'next/navigation';

import { getEditEventDraft } from '@/components/venue/edit-event-model';
import { CreateEventScreen } from '@/components/venue/screens/CreateEventScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Edit event · Venue Studio' };

export default async function VenueEditEventPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const draft = getEditEventDraft(eventId);
  if (!draft) notFound();
  return <CreateEventScreen mode="edit" initialDraft={draft} />;
}
