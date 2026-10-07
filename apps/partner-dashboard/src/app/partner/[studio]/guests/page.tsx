import { PromoterGuestsScreen } from '@/components/partner-v3/promoter/PromoterGuestsScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioGuestsPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (studio !== 'promoter')
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Guests',
      'Guest tools are reserved for the Promoter Studio screen checkpoint.',
    );
  const query = await searchParams;
  const getValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const status = getValue(query['status']) === 'ticket' ? ('ticket' as const) : ('all' as const);
  const data = await fixturePartnerDataSource.getPromoterGuests();
  return (
    <PromoterGuestsScreen
      data={data}
      initialSearch={getValue(query['search']) ?? ''}
      initialStatus={status}
      initialEvent={getValue(query['event']) ?? 'all'}
      initialDialog={getValue(query['dialog']) === 'add'}
    />
  );
}
