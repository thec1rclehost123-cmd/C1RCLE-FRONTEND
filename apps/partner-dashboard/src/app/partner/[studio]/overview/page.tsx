import { notFound } from 'next/navigation';

import { OverviewScreen } from '@/components/partner-v3/overview/OverviewScreen';
import { PromoterOverviewScreen } from '@/components/partner-v3/overview/PromoterOverviewScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';
import { isStudioRole } from '@/studios/studio-config';

export default async function StudioOverviewPage({ params }: { readonly params: Promise<{ studio: string }> }) {
  const { studio } = await params;
  if (!isStudioRole(studio)) notFound();

  if (studio === 'promoter') {
    const overview = await fixturePartnerDataSource.getPromoterOverview();
    return (
      <PromoterOverviewScreen
        data={overview}
        links={{
          events: '/partner/promoter/events',
          guests: '/partner/promoter/guests',
          analytics: '/partner/promoter/analytics',
          finance: '/partner/promoter/finance',
        }}
      />
    );
  }

  const isHost = studio === 'host';
  const overview = isHost
    ? await fixturePartnerDataSource.getHostOverview()
    : await fixturePartnerDataSource.getVenueOverview();
  const prefix = `/partner/${studio}`;
  return (
    <OverviewScreen
      data={overview}
      accent={isHost ? 'lavender' : 'orange'}
      links={{
        createEvent: `${prefix}/events/create`,
        calendar: `${prefix}/calendar`,
        events: `${prefix}/events`,
        finance: `${prefix}/finance`,
        partners: `${prefix}/partners`,
      }}
    />
  );
}
