import { NotificationCenterScreen } from '@/components/venue/screens/NotificationCenterScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notifications · Venue Studio' };

export default function VenueNotificationsPage() {
  return <NotificationCenterScreen />;
}
