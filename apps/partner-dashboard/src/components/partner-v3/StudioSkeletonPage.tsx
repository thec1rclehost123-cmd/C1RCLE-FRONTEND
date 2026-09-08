import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { StudioRoutePlaceholder } from './StudioRoutePlaceholder';

import type { StudioRole } from '@/studios/studio-config';

export async function StudioSkeletonPage({
  studio,
  title,
  description,
}: {
  readonly studio: StudioRole;
  readonly title: string;
  readonly description: string;
}) {
  const shellData = await fixturePartnerDataSource.getStudioShell(studio);

  return (
    <StudioRoutePlaceholder
      studioLabel={shellData.displayName}
      title={title}
      description={description}
    />
  );
}
