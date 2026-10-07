import { renderStudioSkeleton } from '../../../route-helpers';

export default function StudioEventAnalyticsPage({
  params,
}: {
  readonly params: Promise<{ studio: string; eventId: string }>;
}) {
  return renderStudioSkeleton(
    params,
    'Event analytics',
    'Analytics are intentionally unavailable until the relevant data contract is approved.',
  );
}
