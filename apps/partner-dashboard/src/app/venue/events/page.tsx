import { EventsScreen } from '@/components/venue/screens/EventsScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events · Venue Studio',
};

export default function VenueEventsPage() {
  return <EventsScreen />;
}
