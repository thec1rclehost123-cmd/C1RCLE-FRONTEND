import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Create event · Venue Studio' };

export default function VenueCreateEventPage() {
  redirect('/partner/venue/events/create');
}
