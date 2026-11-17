import { notFound } from 'next/navigation';

import { PartnerDoorSelectionScreen } from '@/components/partner-v3/door/PartnerDoorSelectionScreen';

export default async function StudioDoorPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio !== 'venue') notFound();
  return <PartnerDoorSelectionScreen />;
}
