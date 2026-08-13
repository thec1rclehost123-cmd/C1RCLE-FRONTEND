import { PromoterPartnerProfilePage } from '@/components/promoter/PromoterPartnerProfilePage';

export default async function HostProfilePage({
  params,
}: {
  readonly params: Promise<{ hostId: string }>;
}) {
  return <PromoterPartnerProfilePage id={(await params).hostId} kind="host" />;
}
