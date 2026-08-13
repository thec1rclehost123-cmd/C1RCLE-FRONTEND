import { notFound } from 'next/navigation';

import { eventDetailById } from '@/components/promoter/promoter-event-detail-model';
import {
  EventHero,
  LineChart,
  MetricStrip,
  ReadOnlyTerms,
} from '@/components/promoter/PromoterStudioUi';

export default async function EventOverviewPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const model = eventDetailById(eventId);
  if (!model) notFound();
  const { event, link, metrics } = model;
  return (
    <div className="pr-page pr-event-scope">
      <EventHero event={event} active="overview" />
      <MetricStrip
        items={[
          {
            label: 'Tickets moved',
            value: metrics.tickets,
            detail: link
              ? 'Attributed to your permanent link'
              : 'Create a link to begin attribution',
          },
          { label: 'Link visits', value: metrics.clicks },
          {
            label: 'Conversion',
            value: metrics.conversion,
          },
          { label: 'Commission earned', value: metrics.commission },
        ]}
      />
      <div className="pr-event-detail-grid">
        <LineChart
          title="Attributed tickets"
          value={link ? `+${Math.max(0, link.tickets - 152).toString()}` : 'No data'}
          values={link ? [22, 36, 31, 48, 62, 71, 94] : [0, 0, 0, 0, 0, 0, 0]}
          labels={['10 Jul', '11 Jul', '12 Jul', '13 Jul', '14 Jul', '15 Jul', '16 Jul']}
        />
        <ReadOnlyTerms event={event} />
      </div>
    </div>
  );
}
