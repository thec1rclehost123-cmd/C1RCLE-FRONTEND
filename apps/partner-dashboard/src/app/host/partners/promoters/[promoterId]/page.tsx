import { HostPartnerProfileScreen } from '@/components/host/HostPartnerProfileScreen';

export default async function Page({
  params,
}: {
  readonly params: Promise<{ readonly promoterId: string }>;
}) {
  return <HostPartnerProfileScreen kind="promoter" id={(await params).promoterId} />;
}
