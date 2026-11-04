import { ConnectedPartnerGuestsIndexScreen } from '@/components/partner-v3/event-detail/ConnectedPartnerGuestsIndexScreen';
import { loadPartnerEvents } from '@/lib/events/load-partner-events';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioGuestsPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio === 'promoter') {
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Guests',
      'Promoter guest records are not available until a tenant-scoped referral read model is connected.',
    );
  }
  if (studio === 'venue' || studio === 'host') {
    const data = await loadPartnerEvents({ studio });
    return <ConnectedPartnerGuestsIndexScreen data={data} studio={studio} />;
  }
  return renderStudioSkeleton(
    Promise.resolve({ studio }),
    'Guests',
    studio === 'promoter'
      ? 'Promoter guest records are not available until a tenant-scoped referral read model is connected. No guest details are shown.'
      : 'Guest tools are not available for this workspace.',
  );
}
