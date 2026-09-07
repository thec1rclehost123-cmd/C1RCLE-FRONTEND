import { CreateEventScreen } from '@/components/venue/screens/CreateEventScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Create event · Venue Studio' };

export default function VenueCreateEventPage() {
  return <CreateEventScreen />;
}
