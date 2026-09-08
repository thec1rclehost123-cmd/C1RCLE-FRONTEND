import { PartnerDoorModeScreen } from '@/components/partner-v3/door/PartnerDoorModeScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioDoorPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host')
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Door',
      'Door Mode is available for Venue and Host in this checkpoint.',
    );
  const data =
    studio === 'host'
      ? await fixturePartnerDataSource.getHostDoorMode()
      : await fixturePartnerDataSource.getVenueDoorMode();
  return <PartnerDoorModeScreen data={data} />;
}
