import { notFound } from 'next/navigation';

import { HostEventInvitationsUnavailable } from '@/components/partner-v3/events/HostEventInvitationsUnavailable';

export default async function HostEventInvitationsPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio !== 'host') notFound();
  return <HostEventInvitationsUnavailable />;
}
