
import { EventCrowdBreakdown } from './EventCrowdBreakdown';
import { EventRevenueBreakdown } from './EventRevenueBreakdown';
import { EventSalesComparison } from './EventSalesComparison';
import { EventSalesFunnel } from './EventSalesFunnel';
import { EventSalesSummary } from './EventSalesSummary';

import type { EventSalesView, PartnerEventDetailData } from '@/data/partner-data-source';

export function parseEventSalesView(value: string | string[] | undefined): EventSalesView {
  const view = Array.isArray(value) ? value[0] : value;
  return view === 'funnel' || view === 'revenue' || view === 'crowd' || view === 'compare' ? view : 'summary';
}

export function EventSalesExperience({ accent = 'orange', data, view }: { readonly accent?: 'orange' | 'lavender'; readonly data: PartnerEventDetailData; readonly view: EventSalesView }) {
  if (view === 'funnel') return <EventSalesFunnel data={data.sales.funnel} />;
  if (view === 'revenue') return <EventRevenueBreakdown data={data.sales.revenue} />;
  if (view === 'crowd') return <EventCrowdBreakdown accent={accent} data={data.sales.crowd} />;
  if (view === 'compare') return <EventSalesComparison accent={accent} rows={data.sales.comparison} />;
  return <EventSalesSummary accent={accent} summary={data.salesSummary} />;
}
