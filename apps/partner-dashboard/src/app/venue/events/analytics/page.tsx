import { VenueEventsAnalyticsScreen } from '@/components/venue/screens/VenueEventsAnalyticsScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events Analytics · Venue Studio',
};

export default function VenueEventsAnalyticsPage() {
  return <VenueEventsAnalyticsScreen />;
}
