import { notFound } from 'next/navigation';

import { PromoterAssignmentDetailsScreen } from '@/components/promoter/PromoterAssignmentDetailsScreen';
import { loadPromoterEvents } from '@/lib/events/load-promoter-events';

export default async function PromoterEventReferralsPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  const { studio, eventId } = await params;
  if (studio !== 'promoter') notFound();
  const data = await loadPromoterEvents();
  const event = [...data.linkedEvents, ...data.invitations].find((item) => item.id === eventId);
  if (!event) notFound();
  return (
    <PromoterAssignmentDetailsScreen
      event={event}
      links={data.referralLinks}
      activeTab="referrals"
    />
  );
}
