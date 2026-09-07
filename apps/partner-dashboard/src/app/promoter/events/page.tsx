import { PromoterEventsScreen } from '@/components/promoter/PromoterEventsScreen';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function PromoterEventsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const requested = (await searchParams)['view'];
  const activeTab = typeof requested === 'string' ? requested : 'linked';

  const [linkedEvents, discoveryEvents] = await Promise.all([
    partnerRepositories.promoter.getLinkedEvents(),
    partnerRepositories.promoter.discoverEvents(),
  ]);

  return (
    <PromoterEventsScreen
      linkedEvents={linkedEvents}
      discoveryEvents={discoveryEvents}
      activeTab={activeTab}
    />
  );
}
