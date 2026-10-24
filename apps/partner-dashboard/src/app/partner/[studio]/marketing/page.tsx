import { notFound } from 'next/navigation';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioMarketingPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host') notFound();
  return renderStudioSkeleton(
    Promise.resolve({ studio }),
    'Marketing',
    'Marketing delivery and campaign analytics are not connected to an authorized tenant-scoped service yet.',
  );
}
