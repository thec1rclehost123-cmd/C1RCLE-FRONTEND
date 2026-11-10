import { notFound } from 'next/navigation';

import { PartnerStudioFrame } from '@/components/partner-v3/PartnerStudioFrame';
import { isStudioRole } from '@/studios/studio-config';

import type { ReactNode } from 'react';

export default async function StudioLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (!isStudioRole(studio)) notFound();

  return <PartnerStudioFrame studio={studio}>{children}</PartnerStudioFrame>;
}
