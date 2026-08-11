import { DoorModeScreen } from '@/components/venue/screens/DoorModeScreen';

import type { DoorTab } from '@/components/venue/venue-door-model';

const tabs: readonly DoorTab[] = ['scanner', 'guests', 'walk-ins'];

export default async function VenueDoorPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const requested = (await searchParams)['tab'];
  const tab =
    typeof requested === 'string' && tabs.includes(requested as DoorTab)
      ? (requested as DoorTab)
      : 'scanner';
  return <DoorModeScreen tab={tab} />;
}
