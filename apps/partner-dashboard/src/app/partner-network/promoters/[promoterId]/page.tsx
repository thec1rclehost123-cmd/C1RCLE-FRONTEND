import { notFound } from 'next/navigation';

import { DashboardButton, DashboardPageHeader } from '@/components/partner-shell/DashboardUi';
import { PartnerNetworkAccess } from '@/components/promoter/PartnerNetworkAccess';
import { PromoterNetworkProfile } from '@/components/promoter/PromoterNetworkProfile';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function PartnerNetworkPromoterPage({
  params,
}: {
  readonly params: Promise<{ promoterId: string }>;
}) {
  const { promoterId } = await params;
  const profile = await partnerRepositories.promoter.getNetworkProfile();
  if (promoterId !== profile.profile.id) notFound();
  return (
    <PartnerNetworkAccess>
      <DashboardPageHeader
        eyebrow="Private Partner Network"
        title="Promoter profile"
        description="Performance and collaboration signals for verified venues and hosts. Financial data is intentionally excluded."
        actions={
          <DashboardButton href="/" tone="secondary">
            Back to dashboard
          </DashboardButton>
        }
      />
      <PromoterNetworkProfile data={profile} />
    </PartnerNetworkAccess>
  );
}
