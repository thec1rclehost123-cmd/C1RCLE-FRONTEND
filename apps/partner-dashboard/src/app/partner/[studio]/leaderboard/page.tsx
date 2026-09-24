import { PromoterLeaderboardScreen } from '@/components/partner-v3/promoter/PromoterLeaderboardScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioLeaderboardPage({
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
      'Leaderboard',
      'Leaderboard data is intentionally unavailable during the foundation checkpoint.',
    );
  const query = await searchParams;
  const getValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const data = await fixturePartnerDataSource.getPromoterLeaderboard();
  const periodValue = getValue(query['period']);
  const cityValue = getValue(query['city']);
  const period = data.periods.some((option) => option.value === periodValue)
    ? (periodValue ?? 'all')
    : 'all';
  const city = data.cities.some((option) => option.value === cityValue)
    ? (cityValue ?? 'global')
    : 'global';
  return <PromoterLeaderboardScreen data={data} initialPeriod={period} initialCity={city} />;
}
