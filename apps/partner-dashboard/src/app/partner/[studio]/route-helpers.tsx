import { notFound } from 'next/navigation';

import { StudioSkeletonPage } from '@/components/partner-v3/StudioSkeletonPage';
import { isStudioRole } from '@/studios/studio-config';

export function renderStudioSkeleton(params: Promise<{ studio: string }>, title: string, description: string) {
  return params.then(({ studio }) => {
    if (!isStudioRole(studio)) notFound();
    return <StudioSkeletonPage studio={studio} title={title} description={description} />;
  });
}
