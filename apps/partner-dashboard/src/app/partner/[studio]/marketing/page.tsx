import { notFound } from 'next/navigation';

import { PartnerMarketingScreen } from '@/components/partner-v3/marketing/PartnerMarketingScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

export default async function StudioMarketingPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  const data =
    studio === 'venue'
      ? await fixturePartnerDataSource.getVenueMarketing()
      : await fixturePartnerDataSource.getHostMarketing();
  return <PartnerMarketingScreen data={data} />;
}
