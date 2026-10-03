import { NotificationCenterScreen } from '@/components/venue/screens/NotificationCenterScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notifications · Host Studio' };

export default function HostNotificationsPage() {
  return <NotificationCenterScreen surface="host" />;
}
