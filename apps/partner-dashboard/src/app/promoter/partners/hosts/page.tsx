import { partners } from '@/components/promoter/promoter-studio-model';
import {
  PartnerCard,
  PromoterPageHeader,
  PromoterTabs,
} from '@/components/promoter/PromoterStudioUi';

export default function HostsPage() {
  const hosts = partners.filter(
    (partner) => partner.kind === 'host' && partner.relationship === 'partnered',
  );
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Trusted network"
        title="Partners"
        description="Hosts you already work with, with credibility signals—not personal contact information."
      />
      <PromoterTabs
        active="hosts"
        items={[
          { label: 'Venues', value: 'venues', href: '/promoter/partners' },
          { label: 'Hosts', value: 'hosts', href: '/promoter/partners/hosts', count: hosts.length },
          { label: 'Find partners', value: 'find', href: '/promoter/partners/find' },
        ]}
      />
      <section className="pr-partner-grid">
        {hosts.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </section>
    </div>
  );
}
