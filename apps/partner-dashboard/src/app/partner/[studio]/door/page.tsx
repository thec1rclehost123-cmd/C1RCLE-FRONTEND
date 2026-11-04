import { notFound } from 'next/navigation';

import { PartnerDoorModeScreen } from '@/components/partner-v3/door/PartnerDoorModeScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';
import { partnerPreviewFeatures } from '@/lib/partner/preview-features';

export default async function StudioDoorPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  if (!partnerPreviewFeatures.studioDoor) notFound();
  const { studio } = await params;
  if (studio === 'venue') {
    const data = await fixturePartnerDataSource.getVenueDoorMode();
    return <PartnerDoorModeScreen data={data} />;
  }
  if (studio === 'host') {
    const data = await fixturePartnerDataSource.getHostDoorMode();
    return <PartnerDoorModeScreen data={data} />;
  }
  notFound();
}
