import { PartnerSettingsScreen } from '@/components/partner-v3/settings/PartnerSettingsScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioSettingsPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio === 'venue')
    return <PartnerSettingsScreen data={await fixturePartnerDataSource.getVenueSettings()} />;
  if (studio === 'host')
    return <PartnerSettingsScreen data={await fixturePartnerDataSource.getHostSettings()} />;
  return renderStudioSkeleton(
    Promise.resolve({ studio }),
    'Settings',
    'Settings is available for Venue and Host in this checkpoint.',
  );
}
