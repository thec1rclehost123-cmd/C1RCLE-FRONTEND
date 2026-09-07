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
  const activeTab = tab === 'performance' || tab === 'orders' || tab === 'links' || tab === 'commission'
    ? tab
    : 'summary';
  const needsOrders = activeTab === 'summary' || activeTab === 'orders';
  const needsLinks = activeTab === 'summary' || activeTab === 'links';
  const [linked, discover, overview, links] = await Promise.all([
    partnerRepositories.promoter.getLinkedEvents(),
    partnerRepositories.promoter.discoverEvents(),
    needsOrders ? partnerRepositories.promoter.getOverview() : Promise.resolve(null),
    needsLinks ? partnerRepositories.promoter.getLinks() : Promise.resolve([]),
  ]);

  const event = [...linked, ...discover].find((candidate) => candidate.id === eventId);
  if (!event) notFound();

  return (
    <PromoterEventDetailScreen
      event={event}
      orders={overview?.recentOrders ?? []}
      links={links}
      activeTab={activeTab}
    />
  );
}
