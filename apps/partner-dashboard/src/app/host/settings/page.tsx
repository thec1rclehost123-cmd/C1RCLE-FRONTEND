import { HostProfileEditor } from '@/components/host/HostProfileEditor';
import { DashboardPageHeader, MetricCard } from '@/components/partner-shell/DashboardUi';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function HostSettingsPage() {
  const profile = await partnerRepositories.host.getProfile();
  return <>
    <DashboardPageHeader eyebrow="Host identity" title="Profile & settings" description="Keep the identity that venues and promoters use to evaluate your work complete and trustworthy." />
    <section className="pd-metrics host-profile-metrics">
      <MetricCard label="Profile completion" value={`${String(profile.completion)}%`} detail="2 improvements remaining" tone="positive" />
      <MetricCard label="Verification" value={profile.verified ? 'Verified' : 'Pending'} detail="organization trust status" tone="accent" />
      <MetricCard label="Primary city" value={profile.city} detail="used for recommendations" />
      <MetricCard label="Categories" value={String(profile.categories.length)} detail={profile.categories.join(' · ')} />
    </section>
    <HostProfileEditor profile={profile} />
  </>;
}
