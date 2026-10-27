import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioDoorPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  return renderStudioSkeleton(
    Promise.resolve({ studio }),
    'Door operations',
    studio === 'venue' || studio === 'host'
      ? 'Door operations, scanning, and walk-in sales are deferred to Milestone 4. No operational guest or sales data is shown.'
      : 'Door operations are not available for this workspace.',
  );
}
