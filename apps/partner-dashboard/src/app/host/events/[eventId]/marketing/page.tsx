import { HostEventMarketingScreen } from '@/components/host/HostEventDetailScreen';

export default async function Page({
  params,
}: {
  readonly params: Promise<{ readonly eventId: string }>;
}) {
  return <HostEventMarketingScreen id={(await params).eventId} />;
}
