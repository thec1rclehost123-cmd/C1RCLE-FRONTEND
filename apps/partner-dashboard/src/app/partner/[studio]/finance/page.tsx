import { notFound } from 'next/navigation';

import { FinanceLoadFailureState } from '@/components/partner-v3/finance/FinanceLoadFailureState';
import { HostFinanceScreen } from '@/components/partner-v3/finance/HostFinanceScreen';
import { PromoterFinanceScreen } from '@/components/partner-v3/finance/PromoterFinanceScreen';
import { VenueFinanceScreen } from '@/components/partner-v3/finance/VenueFinanceScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';
import { FinanceLoadError, loadFinanceData } from '@/lib/finance/load-finance-data';

import type {
  FinanceDateRange,
  FinanceOrderStatus,
  FinanceView,
  PartnerFinanceData,
} from '@/data/partner-data-source';

export default async function StudioFinancePage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host' && studio !== 'promoter') {
    notFound();
  }

  // Promoters get their own screen (leaderboard-shaped, not a payouts desk), and
  // `PromoterFinanceData` is a different model from `PartnerFinanceData` — so it
  // is not on this loader's path yet. Left on the fixture deliberately rather
  // than force-fed partner-shaped data that would misreport a commission as a
  // balance.
  if (studio === 'promoter') {
    const data = await fixturePartnerDataSource.getPromoterFinance();
    return <PromoterFinanceScreen data={data} />;
  }

  const query = await searchParams;
  const getValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const viewValue = getValue(query['view']);
  const view: FinanceView = viewValue === 'orders' || viewValue === 'bank' ? viewValue : 'payouts';
  const range: FinanceDateRange = getValue(query['range']) === 'all' ? 'all' : 'current';
  const statusValue = getValue(query['status']);
  const status: 'All' | FinanceOrderStatus =
    statusValue === 'confirmed'
      ? 'Confirmed'
      : statusValue === 'pending'
        ? 'Pending'
        : statusValue === 'refunded'
          ? 'Refunded'
          : statusValue === 'cancelled'
            ? 'Cancelled'
            : 'All';
  const sortValue = getValue(query['sort']);
  const sort: 'tickets' | 'amount' | null =
    sortValue === 'tickets' || sortValue === 'amount' ? sortValue : null;
  const direction = getValue(query['direction']) === 'asc' ? ('asc' as const) : ('desc' as const);

  // Real reads. The accent is a role tint, nothing more — the gateway is what
  // decides whether this viewer may read this org's money.
  //
  // The loader throws rather than degrading to fixture numbers, so the failure
  // is handled here instead of falling through to the route's `error.tsx`:
  // Next strips a Server Component's `error.message` in production, so by the
  // time an `error.tsx` boundary sees it, the *kind* of failure is unrecoverable
  // and every case would collapse into one generic "could not load". Catching
  // here keeps `reason` intact and lets each case offer the right next step.
  let data: PartnerFinanceData;
  try {
    data = await loadFinanceData({ accent: studio === 'host' ? 'lavender' : 'orange' });
  } catch (cause) {
    if (cause instanceof FinanceLoadError) {
      return <FinanceLoadFailureState reason={cause.reason} />;
    }
    // Not ours — rethrow so the route's `error.tsx` reports it as unexpected.
    throw cause;
  }

  const props = {
    data,
    view,
    search: getValue(query['search']) ?? '',
    range,
    status,
    sort,
    direction,
  };

  return studio === 'host' ? <HostFinanceScreen {...props} /> : <VenueFinanceScreen {...props} />;
}
