import { notFound } from 'next/navigation';

import { PartnerSupportScreen } from '@/components/partner-support/PartnerSupportScreen';

export default async function StudioSupportPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio === 'venue' || studio === 'host') {
    return <PartnerSupportScreen />;
  }
  return notFound();
}
