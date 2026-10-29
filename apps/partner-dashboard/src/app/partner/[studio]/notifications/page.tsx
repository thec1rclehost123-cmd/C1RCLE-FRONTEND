import { notFound } from 'next/navigation';

import { CurrentPartnerNotificationsInboxPage } from '@/components/partner-v3/ConnectedPartnerNotifications';
import { isStudioRole } from '@/studios/studio-config';

export default async function StudioNotificationsPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (!isStudioRole(studio)) notFound();
  return <CurrentPartnerNotificationsInboxPage />;
}
