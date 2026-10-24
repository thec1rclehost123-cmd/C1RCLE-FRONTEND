import { HostEventsScreen } from '@/components/partner-v3/events/HostEventsScreen';
import { PromoterEventsScreen } from '@/components/partner-v3/events/PromoterEventsScreen';
import { VenueEventsScreen } from '@/components/partner-v3/events/VenueEventsScreen';
import { loadPartnerEvents } from '@/lib/events/load-partner-events';
import { loadPromoterEvents } from '@/lib/events/load-promoter-events';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioEventsPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ studio: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { studio } = await params;
  if (studio === 'venue' || studio === 'host' || studio === 'promoter') {
    const query = await searchParams;
    const getValue = (value: string | string[] | undefined) =>
      Array.isArray(value) ? value[0] : value;
    if (studio === 'promoter') {
      const data = await loadPromoterEvents();
      const tab = getValue(query['tab']) === 'linked' ? ('linked' as const) : ('discover' as const);
      const city = getValue(query['city']) ?? 'all';
      return (
        <PromoterEventsScreen
          data={data}
          initialCity={city}
          initialSearch={getValue(query['search']) ?? ''}
          initialTab={tab}
        />
      );
    }

    const status = getValue(query['status']);
    const party = getValue(query['party']);
    const view = getValue(query['view']);
    const sharedProps = {
      initialSearch: getValue(query['search']) ?? '',
      initialStatus:
        status === 'live'
          ? ('Live' as const)
          : status === 'draft'
            ? ('Draft' as const)
            : ('all' as const),
      initialParty:
        party === 'hosts'
          ? ('hosts' as const)
          : party === 'venue'
            ? ('venue' as const)
            : studio === 'host'
              ? ('hosts' as const)
              : ('venue' as const),
      initialView: view === 'list' ? ('list' as const) : ('grid' as const),
    };
    if (studio === 'host') {
      const data = await loadPartnerEvents({ studio: 'host', cursor: getValue(query['cursor']) });
      return <HostEventsScreen data={data} {...sharedProps} />;
    }

    const data = await loadPartnerEvents({ studio: 'venue', cursor: getValue(query['cursor']) });
    return <VenueEventsScreen data={data} {...sharedProps} />;
  }

  return renderStudioSkeleton(
    Promise.resolve({ studio }),
    'Events',
    'Event operations will be added in the next implementation checkpoint.',
  );
}
