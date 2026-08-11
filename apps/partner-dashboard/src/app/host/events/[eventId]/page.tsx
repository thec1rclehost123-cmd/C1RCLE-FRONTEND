import { HostEventSummaryScreen } from '@/components/host/HostEventDetailScreen';

export default async function HostEventPage({
  params,
}: {
  readonly params: Promise<{ readonly eventId: string }>;
}) {
  return <HostEventSummaryScreen id={(await params).eventId} />;
}
