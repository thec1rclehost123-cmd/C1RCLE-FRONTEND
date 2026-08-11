import { HostEventGuestsScreen } from '@/components/host/HostEventDetailScreen';

export default async function Page({
  params,
}: {
  readonly params: Promise<{ readonly eventId: string }>;
}) {
  return <HostEventGuestsScreen id={(await params).eventId} />;
}
