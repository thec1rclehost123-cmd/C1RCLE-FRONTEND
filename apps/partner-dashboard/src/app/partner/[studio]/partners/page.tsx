import { HostPartnersScreen } from '@/components/partner-v3/partners/HostPartnersScreen';
import { PromoterPartnersScreen } from '@/components/partner-v3/partners/PromoterPartnersScreen';
import { VenuePartnersScreen } from '@/components/partner-v3/partners/VenuePartnersScreen';
import {
  loadHostPartnersData,
  loadPromoterPartnersData,
  loadVenuePartnersData,
  StudioPartnersLoadError,
} from '@/lib/partner/load-studio-partners';

import { renderStudioSkeleton } from '../route-helpers';

import type {
  PartnerSegment,
  PartnerSubView,
  PromoterPartnerFilter,
  PromoterPartnerTab,
} from '@/data/partner-data-source';

function LoadFailureNotice({ message }: { readonly message: string }) {
  return (
    <section aria-label="Partners unavailable">
      <h1>Partners</h1>
      <p>{message}</p>
    </section>
  );
}

export default async function StudioPartnersPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host' && studio !== 'promoter')
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Partners',
      'Partner discovery and relationship screens are reserved for a later checkpoint.',
    );

  const query = await searchParams;
  const getValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const tab = getValue(query['tab']);
  const view = getValue(query['view']);
  const segment: PartnerSegment =
    tab === 'promoters'
      ? 'promoters'
      : tab === 'staff'
        ? 'staff'
        : studio === 'host'
          ? 'venues'
          : 'hosts';
  const subView: PartnerSubView =
    view === 'discover' ? 'discover' : view === 'requests' ? 'requests' : 'connected';
  const profileId = getValue(query['profile']);
  if (studio === 'promoter') {
    const tabValue = getValue(query['tab']);
    const filterValue = getValue(query['filter']);
    const promoterTab: PromoterPartnerTab =
      tabValue === 'active' ||
      tabValue === 'incoming' ||
      tabValue === 'pending' ||
      tabValue === 'declined'
        ? tabValue
        : 'discover';
    const promoterFilter: PromoterPartnerFilter =
      filterValue === 'venues' || filterValue === 'hosts' ? filterValue : 'all';
    let data;
    try {
      data = await loadPromoterPartnersData();
    } catch (cause) {
      if (
        cause instanceof StudioPartnersLoadError &&
        (cause.reason === 'no-organization' || cause.reason === 'signed-out')
      ) {
        return <LoadFailureNotice message="Select an organization to see its partners." />;
      }
      return (
        <LoadFailureNotice message="Could not load partners. Check your connection and reload the page." />
      );
    }
    return (
      <PromoterPartnersScreen
        data={data}
        tab={promoterTab}
        filter={promoterFilter}
        search={getValue(query['search']) ?? ''}
      />
    );
  }
  if (studio === 'host') {
    let data;
    try {
      data = await loadHostPartnersData();
    } catch (cause) {
      if (
        cause instanceof StudioPartnersLoadError &&
        (cause.reason === 'no-organization' || cause.reason === 'signed-out')
      ) {
        return <LoadFailureNotice message="Select an organization to see its partners." />;
      }
      return (
        <LoadFailureNotice message="Could not load partners. Check your connection and reload the page." />
      );
    }
    return (
      <HostPartnersScreen
        data={data}
        segment={segment}
        subView={subView}
        search={getValue(query['search']) ?? ''}
        {...(profileId ? { profileId } : {})}
      />
    );
  }

  let data;
  try {
    data = await loadVenuePartnersData();
  } catch (cause) {
    if (
      cause instanceof StudioPartnersLoadError &&
      (cause.reason === 'no-organization' || cause.reason === 'signed-out')
    ) {
      return <LoadFailureNotice message="Select an organization to see its partners." />;
    }
    return (
      <LoadFailureNotice message="Could not load partners. Check your connection and reload the page." />
    );
  }
  return (
    <VenuePartnersScreen
      data={data}
      segment={segment}
      subView={subView}
      search={getValue(query['search']) ?? ''}
      {...(profileId ? { profileId } : {})}
    />
  );
}
