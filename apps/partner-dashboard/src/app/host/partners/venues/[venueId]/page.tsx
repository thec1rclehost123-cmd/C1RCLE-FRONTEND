import { HostPartnerProfileScreen } from '@/components/host/HostPartnerProfileScreen';

export default async function Page({
  params,
}: {
  readonly params: Promise<{ readonly venueId: string }>;
}) {
  return <HostPartnerProfileScreen kind="venue" id={(await params).venueId} />;
}
