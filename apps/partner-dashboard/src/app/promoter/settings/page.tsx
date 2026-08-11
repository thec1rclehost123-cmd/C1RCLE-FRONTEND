import { DashboardButton, DashboardPageHeader } from '@/components/partner-shell/DashboardUi';
import { PromoterNetworkProfile } from '@/components/promoter/PromoterNetworkProfile';
import { PromoterProfileEditor } from '@/components/promoter/PromoterProfileEditor';
import { PromoterProfileShareButton } from '@/components/promoter/PromoterShareActions';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function PromoterSettingsPage() {
  const [profile, networkProfile] = await Promise.all([
    partnerRepositories.promoter.getProfile(),
    partnerRepositories.promoter.getNetworkProfile(),
  ]);
  return (
    <>
      <DashboardPageHeader eyebrow="Trust profile" title="Profile & settings" description="Shape the private performance profile that verified venues and hosts use when deciding who to work with." actions={<><PromoterProfileShareButton /><DashboardButton href={`/partner-network/promoters/${profile.id}`} tone="primary">View partner profile</DashboardButton></>} />
      <div className="promoter-settings-grid"><PromoterProfileEditor profile={profile} /><section><div className="promoter-profile-preview-label"><span>Venue & host preview</span><small>No revenue is shown</small></div><PromoterNetworkProfile data={networkProfile} /></section></div>
    </>
  );
}
