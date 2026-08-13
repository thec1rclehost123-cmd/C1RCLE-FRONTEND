import { partners } from '@/components/promoter/promoter-studio-model';
import {
  PartnerCard,
  PromoterPageHeader,
  PromoterTabs,
} from '@/components/promoter/PromoterStudioUi';

export default function PromoterPartnersPage() {
  const venues = partners.filter(
    (partner) => partner.kind === 'venue' && partner.relationship === 'partnered',
  );
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Trusted network"
        title="Partners"
        description="Venues and hosts you already work with. Private contact details are never shown."
      />
      <PromoterTabs
        active="venues"
        items={[
          { label: 'Venues', value: 'venues', href: '/promoter/partners', count: venues.length },
          {
            label: 'Hosts',
            value: 'hosts',
            href: '/promoter/partners/hosts',
            count: partners.filter(
              (item) => item.kind === 'host' && item.relationship === 'partnered',
            ).length,
          },
          { label: 'Find partners', value: 'find', href: '/promoter/partners/find' },
        ]}
      />
      <section className="pr-partner-grid">
        {venues.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </section>
    </div>
  );
}
