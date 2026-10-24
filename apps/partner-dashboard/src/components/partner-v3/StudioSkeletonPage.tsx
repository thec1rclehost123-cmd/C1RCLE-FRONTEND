import { getStudioConfig } from '@/studios/studio-config';

import { StudioRoutePlaceholder } from './StudioRoutePlaceholder';

import type { StudioRole } from '@/studios/studio-config';

export function StudioSkeletonPage({
  studio,
  title,
  description,
}: {
  readonly studio: StudioRole;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <StudioRoutePlaceholder
      studioLabel={getStudioConfig(studio).label}
      title={title}
      description={description}
    />
  );
}
