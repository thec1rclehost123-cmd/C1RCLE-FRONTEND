import { VenueOrdersScreen } from '@/components/venue/screens/VenueOrdersScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Orders · Finance · Venue Studio' };

export default function VenueOrdersPage() {
  return <VenueOrdersScreen />;
}
