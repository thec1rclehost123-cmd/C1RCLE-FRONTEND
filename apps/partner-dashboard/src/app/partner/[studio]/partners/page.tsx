import { StudioPartnersClient } from '@/components/partner-v3/partners/StudioPartnersClient';

import { renderStudioSkeleton } from '../route-helpers';

import type { PartnerSegment, PartnerSubView, PromoterPartnerFilter, PromoterPartnerTab } from '@/data/partner-data-source';

/**
 * Partners tab. Partner rows are loaded client-side from the backend
 * (`partnerships` + `promoter-connections`) — there is no fixture/dummy
 * fallback here, so an empty database renders empty states, never
 * fabricated venue/host/promoter profiles.
 */
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
  const tabValue = getValue(query['tab']);
  const filterValue = getValue(query['filter']);
  const promoterTab: PromoterPartnerTab = tabValue === 'active' || tabValue === 'incoming' || tabValue === 'pending' || tabValue === 'declined' ? tabValue : 'discover';
  const promoterFilter: PromoterPartnerFilter = filterValue === 'venues' || filterValue === 'hosts' ? filterValue : 'all';

  return <StudioPartnersClient studio={studio} segment={segment} subView={subView} search={getValue(query['search']) ?? ''} promoterTab={promoterTab} promoterFilter={promoterFilter} {...(profileId ? { profileId } : {})} />;
}
