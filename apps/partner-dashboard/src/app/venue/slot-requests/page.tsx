import { SlotRequestsScreen } from '@/components/venue/screens/SlotRequestsScreen';

import type { SlotRequestTab } from '@/components/venue/venue-slot-requests-model';

const tabs: readonly SlotRequestTab[] = ['pending', 'accepted', 'declined'];

export default async function VenueSlotRequestsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const requested = (await searchParams)['tab'];
  const tab =
    typeof requested === 'string' && tabs.includes(requested as SlotRequestTab)
      ? (requested as SlotRequestTab)
      : 'pending';
  return <SlotRequestsScreen tab={tab} />;
}
