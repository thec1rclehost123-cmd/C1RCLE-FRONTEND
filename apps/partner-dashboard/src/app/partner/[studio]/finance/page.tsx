import { notFound } from 'next/navigation';

import { HostFinanceScreen } from '@/components/partner-v3/finance/HostFinanceScreen';
import { PromoterFinanceScreen } from '@/components/partner-v3/finance/PromoterFinanceScreen';
import { VenueFinanceScreen } from '@/components/partner-v3/finance/VenueFinanceScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import type { FinanceDateRange, FinanceOrderStatus, FinanceView } from '@/data/partner-data-source';

export default async function StudioFinancePage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (studio === 'promoter') {
    const data = await fixturePartnerDataSource.getPromoterFinance();
    return <PromoterFinanceScreen data={data} />;
  }
  if (studio !== 'venue' && studio !== 'host') {
    notFound();
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
  const data =
    studio === 'host'
      ? await fixturePartnerDataSource.getHostFinance()
      : await fixturePartnerDataSource.getVenueFinance();
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
