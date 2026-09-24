import { notFound, redirect } from 'next/navigation';

import { isStudioRole } from '@/studios/studio-config';

export default async function StudioEntryPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (!isStudioRole(studio)) notFound();
  redirect(`/partner/${studio}/overview`);
}
