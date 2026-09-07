import { HostLegacyAnalyticsRedirectNotice } from '@/components/host/HostEventDetailScreen';

export default async function HostEventAnalyticsPage({
  params,
}: {
  readonly params: Promise<{ readonly eventId: string }>;
}) {
  return <HostLegacyAnalyticsRedirectNotice id={(await params).eventId} />;
}
