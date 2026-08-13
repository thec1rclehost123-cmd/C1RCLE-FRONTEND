import { notFound } from 'next/navigation';

import {
  acceptedEvents,
  conversionRate,
  formatInr,
  linkForEvent,
} from '@/components/promoter/promoter-studio-model';
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
  const event = acceptedEvents.find((item) => item.id === eventId);
  if (!event) notFound();
  const link = linkForEvent(event.id);
  return (
    <div className="pr-page pr-event-scope">
      <EventHero event={event} active="overview" />
      <MetricStrip
        items={[
          {
            label: 'Tickets moved',
            value: link?.tickets.toLocaleString('en-IN') ?? '—',
            detail: link
              ? 'Attributed to your permanent link'
              : 'Create a link to begin attribution',
          },
          { label: 'Link visits', value: link?.clicks.toLocaleString('en-IN') ?? '—' },
          {
            label: 'Conversion',
            value: link ? `${conversionRate(link.orders, link.clicks).toString()}%` : '—',
          },
          { label: 'Commission earned', value: link ? formatInr(link.earnedPaise) : '—' },
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
