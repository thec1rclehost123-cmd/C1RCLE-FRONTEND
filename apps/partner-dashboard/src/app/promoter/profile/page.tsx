import { promoterProfile } from '@/components/promoter/promoter-studio-model';
import {
  MetricStrip,
  PromoterButton,
  PromoterPageHeader,
  StatusBadge,
} from '@/components/promoter/PromoterStudioUi';

export default function ProfilePage() {
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Partner Network profile"
        title={promoterProfile.name}
        description="This credibility profile is visible to verified venues and hosts. Revenue, payouts and private contact details stay hidden."
        actions={<PromoterButton href="/promoter/settings/profile">Edit profile</PromoterButton>}
      />
      <section className="pr-profile-hero pr-glass-panel">
        <div className="pr-partner-avatar pr-partner-avatar--large">{promoterProfile.initials}</div>
        <div>
          <span className="pr-eyebrow">Promoter</span>
          <h1>{promoterProfile.handle}</h1>
          <p>{promoterProfile.city}</p>
        </div>
        <StatusBadge state="verified" />
      </section>
      <MetricStrip
        items={[
          { label: 'Events promoted', value: '18' },
          { label: 'Tickets moved', value: '4,672' },
          { label: 'Repeat partners', value: '7' },
          { label: 'Profile completion', value: `${promoterProfile.completion.toString()}%` },
        ]}
      />
      <section className="pr-section pr-glass-panel">
        <header>
          <div>
            <span className="pr-eyebrow">About</span>
            <h2>Partner introduction</h2>
          </div>
        </header>
        <p>{promoterProfile.bio}</p>
      </section>
    </div>
  );
}
