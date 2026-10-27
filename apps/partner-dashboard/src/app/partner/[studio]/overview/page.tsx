import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { OverviewLoadFailureState } from '@/components/partner-v3/overview/OverviewLoadFailureState';
import { OverviewScreen } from '@/components/partner-v3/overview/OverviewScreen';
import { PromoterMetricsUnavailable } from '@/components/partner-v3/promoter/PromoterMetricsUnavailable';
import { getActiveOrgIdFromCookieHeader } from '@/lib/org/active-org-cookie';
import { loadOverviewData, OverviewLoadError } from '@/lib/overview/load-overview-data';
import { isStudioRole } from '@/studios/studio-config';

export default async function StudioOverviewPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (!isStudioRole(studio)) notFound();

  if (studio === 'promoter') {
    return <PromoterMetricsUnavailable section="Overview" />;
  }

  const isHost = studio === 'host';
  const prefix = `/partner/${studio}`;
  const organizationId = getActiveOrgIdFromCookieHeader((await cookies()).toString());

  // Real reads. The accent is a role tint, nothing more — the gateway decides
  // whether this viewer may read this org's numbers.
  //
  // The loader throws rather than degrading to fixture numbers, so the failure
  // is handled here instead of falling through to the route's `error.tsx`: Next
  // strips a Server Component's `error.message` in production, so by the time an
  // `error.tsx` boundary sees it the *kind* of failure is unrecoverable and every
  // case would collapse into one generic "could not load". Catching here keeps
  // `reason` intact and lets each case offer the right next step.
  let overview: Awaited<ReturnType<typeof loadOverviewData>>;
  try {
    overview = await loadOverviewData({
      accent: isHost ? 'lavender' : 'orange',
      organizationId,
    });
  } catch (cause) {
    if (cause instanceof OverviewLoadError) {
      return <OverviewLoadFailureState reason={cause.reason} />;
    }
    // Not ours — rethrow so the route's `error.tsx` reports it as unexpected.
    throw cause;
  }

  return (
    <OverviewScreen
      data={overview}
      accent={isHost ? 'lavender' : 'orange'}
      studio={isHost ? 'host' : 'venue'}
      organizationId={organizationId}
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
