import { PromoterAnalyticsScreen } from '@/components/partner-v3/promoter/PromoterAnalyticsScreen';
import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioAnalyticsPage({ params, searchParams }: { readonly params: Promise<{ studio: string }>; readonly searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { studio } = await params;
  if (studio !== 'promoter') return renderStudioSkeleton(Promise.resolve({ studio }), 'Analytics', 'Analytics are intentionally unavailable until the relevant data contract is approved.');
  const query = await searchParams;
  const getValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const rangeValue = getValue(query['range']);
  const metricValue = getValue(query['metric']);
  const range = rangeValue === '7D' || rangeValue === 'YTD' || rangeValue === 'ALL' ? rangeValue : '30D';
  const metric = metricValue === 'clicks' || metricValue === 'sales' ? metricValue : 'revenue';
  const data = await fixturePartnerDataSource.getPromoterAnalytics();
  return <PromoterAnalyticsScreen data={data} initialRange={range} initialMetric={metric} />;
}
