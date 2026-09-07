import { HostPartnersScreen } from '@/components/partner-v3/partners/HostPartnersScreen';
import { PromoterPartnersScreen } from '@/components/partner-v3/partners/PromoterPartnersScreen';
import { VenuePartnersScreen } from '@/components/partner-v3/partners/VenuePartnersScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../route-helpers';

import type { PartnerSegment, PartnerSubView, PromoterPartnerFilter, PromoterPartnerTab } from '@/data/partner-data-source';

export default async function StudioPartnersPage({ params, searchParams }: { readonly params: Promise<{ studio: string }>; readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host' && studio !== 'promoter') return renderStudioSkeleton(Promise.resolve({ studio }), 'Partners', 'Partner discovery and relationship screens are reserved for a later checkpoint.');

  const query = await searchParams;
  const getValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const tab = getValue(query['tab']);
  const view = getValue(query['view']);
  const segment: PartnerSegment = tab === 'promoters' ? 'promoters' : tab === 'staff' ? 'staff' : studio === 'host' ? 'venues' : 'hosts';
  const subView: PartnerSubView = view === 'discover' ? 'discover' : view === 'requests' ? 'requests' : 'connected';
  const profileId = getValue(query['profile']);
  if (studio === 'promoter') {
    const data = await fixturePartnerDataSource.getPromoterPartners();
    const tabValue = getValue(query['tab']);
    const filterValue = getValue(query['filter']);
    const promoterTab: PromoterPartnerTab = tabValue === 'active' || tabValue === 'incoming' || tabValue === 'pending' || tabValue === 'declined' ? tabValue : 'discover';
    const promoterFilter: PromoterPartnerFilter = filterValue === 'venues' || filterValue === 'hosts' ? filterValue : 'all';
    return <PromoterPartnersScreen data={data} tab={promoterTab} filter={promoterFilter} search={getValue(query['search']) ?? ''} />;
  }
  if (studio === 'host') {
    const data = await fixturePartnerDataSource.getHostPartners();
    return <HostPartnersScreen data={data} segment={segment} subView={subView} search={getValue(query['search']) ?? ''} {...(profileId ? { profileId } : {})} />;
  }

  const data = await fixturePartnerDataSource.getVenuePartners();
  return <VenuePartnersScreen data={data} segment={segment} subView={subView} search={getValue(query['search']) ?? ''} {...(profileId ? { profileId } : {})} />;
}
