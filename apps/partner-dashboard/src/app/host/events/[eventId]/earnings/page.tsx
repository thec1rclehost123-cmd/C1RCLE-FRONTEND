import { HostEventEarningsScreen } from '@/components/host/HostEventDetailScreen';

export default async function Page({
  params,
}: {
  readonly params: Promise<{ readonly eventId: string }>;
}) {
  return <HostEventEarningsScreen id={(await params).eventId} />;
}
