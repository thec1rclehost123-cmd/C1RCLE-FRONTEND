import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioNotificationsPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  return renderStudioSkeleton(
    Promise.resolve({ studio }),
    'Notifications',
    'Partner notifications are not connected to a tenant-scoped notification service yet.',
  );
}
