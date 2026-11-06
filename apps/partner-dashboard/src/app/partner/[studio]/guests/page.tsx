import { ConnectedPartnerGuestsIndexScreen } from '@/components/partner-v3/event-detail/ConnectedPartnerGuestsIndexScreen';
import { PromoterActivityConnected } from '@/components/partner-v3/promoter/PromoterActivityConnected';
import { loadPartnerEvents } from '@/lib/events/load-partner-events';
import { loadPromoterActivity } from '@/lib/events/load-promoter-activity';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioGuestsPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio === 'promoter') {
    let result: { data: Awaited<ReturnType<typeof loadPromoterActivity>> } | { error: string };
    try {
      result = { data: await loadPromoterActivity() };
    } catch {
      result = {
        error:
          'Attributed activity could not be loaded. Confirm you are in the correct Promoter workspace and try again.',
      };
    }
    return <PromoterActivityConnected {...result} />;
  }
  if (studio === 'venue' || studio === 'host') {
    const data = await loadPartnerEvents({ studio });
    return <ConnectedPartnerGuestsIndexScreen data={data} studio={studio} />;
  }
  return renderStudioSkeleton(
    Promise.resolve({ studio }),
    'Guests',
    'Guest tools are not available for this workspace.',
  );
}
