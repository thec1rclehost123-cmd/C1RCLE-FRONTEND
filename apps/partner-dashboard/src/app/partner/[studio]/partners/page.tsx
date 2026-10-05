import { cookies } from 'next/headers';

import { HostPartnersScreen } from '@/components/partner-v3/partners/HostPartnersScreen';
import { PromoterPartnersScreen } from '@/components/partner-v3/partners/PromoterPartnersScreen';
import { VenuePartnersScreen } from '@/components/partner-v3/partners/VenuePartnersScreen';
import { createServerApiClient } from '@/lib/api/server-client';
import {
  loadHostPartnersData,
  loadPromoterPartnersData,
  loadVenuePartnersData,
  resolveStudioOrganizationId,
  StudioPartnersLoadError,
} from '@/lib/partner/load-studio-partners';

import { renderStudioSkeleton } from '../route-helpers';

import type {
  PartnerSegment,
  PartnerSubView,
  PromoterPartnerFilter,
  PromoterPartnerTab,
} from '@/data/partner-data-source';
import type { ReactNode } from 'react';

function LoadFailureNotice({ message }: { readonly message: string }) {
  return (
    <section aria-label="Partners unavailable">
      <h1>Partners</h1>
      <p>{message}</p>
    </section>
  );
}

/** No selection step exists — login is venue/host/promoter directly — so the
 * copy never asks to pick an organization. Each reason names what is actually
 * missing: a session, an organization, or this studio's access. */
function loadFailureNotice(cause: unknown, studio: 'venue' | 'host' | 'promoter'): ReactNode {
  if (cause instanceof StudioPartnersLoadError) {
    if (cause.reason === 'signed-out') {
      return <LoadFailureNotice message="Sign in to see partners." />;
    }
    if (cause.reason === 'no-organization') {
      return <LoadFailureNotice message="This account has no organization yet." />;
    }
    if (cause.reason === 'forbidden') {
      return <LoadFailureNotice message={`This account has no ${studio} access.`} />;
    }
  }
  return (
    <LoadFailureNotice message="Could not load partners. Check your connection and reload the page." />
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
  // Resolved once from the session (login is venue/host/promoter directly —
  // there is no organization step) and handed to both the data load and the
  // client action islands, so neither depends on the active-org cookie.
  const cookieHeader = (await cookies()).toString();
  let organizationId: string;
  try {
    organizationId = await resolveStudioOrganizationId(
      createServerApiClient(cookieHeader),
      studio,
      {},
      cookieHeader,
    );
  } catch (cause) {
    return loadFailureNotice(cause, studio);
  }
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
      data = await loadPromoterPartnersData({ organizationId });
    } catch (cause) {
      return loadFailureNotice(cause, 'promoter');
    }
    return (
      <PromoterPartnersScreen
        data={data}
        tab={promoterTab}
        filter={promoterFilter}
        search={getValue(query['search']) ?? ''}
        organizationId={organizationId}
      />
    );
  }
  if (studio === 'host') {
    let data;
    try {
      data = await loadHostPartnersData({ organizationId });
    } catch (cause) {
      return loadFailureNotice(cause, 'host');
    }
    return (
      <HostPartnersScreen
        data={data}
        segment={segment}
        subView={subView}
        search={getValue(query['search']) ?? ''}
        organizationId={organizationId}
        {...(profileId ? { profileId } : {})}
      />
    );
  }

  let data;
  try {
    data = await loadVenuePartnersData({ organizationId });
  } catch (cause) {
    return loadFailureNotice(cause, 'venue');
  }
  return (
    <VenuePartnersScreen
      data={data}
      segment={segment}
      subView={subView}
      search={getValue(query['search']) ?? ''}
      organizationId={organizationId}
      {...(profileId ? { profileId } : {})}
    />
  );
}
