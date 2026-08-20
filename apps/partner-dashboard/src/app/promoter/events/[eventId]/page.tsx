import { notFound } from 'next/navigation';

import { PromoterEventDetailScreen } from '@/components/promoter/PromoterEventDetailScreen';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function PromoterEventDetailPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ eventId: string }>;
  readonly searchParams: Promise<{ tab?: string }>;
}) {
  const { eventId } = await params;
  const { tab } = await searchParams;
  const [linked, discover] = await Promise.all([
    partnerRepositories.promoter.getLinkedEvents(),
    partnerRepositories.promoter.discoverEvents(),
  ]);

  const event = [...linked, ...discover].find((candidate) => candidate.id === eventId);
  if (!event) notFound();

  return <PromoterEventDetailScreen event={event} activeTab={tab ?? 'summary'} />;
}
