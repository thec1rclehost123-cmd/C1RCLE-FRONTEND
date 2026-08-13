import { partners } from '@/components/promoter/promoter-studio-model';
import { SegmentedControl } from '@/components/promoter/PromoterStudioActions';
import {
  PartnerCard,
  PromoterPageHeader,
  PromoterTabs,
} from '@/components/promoter/PromoterStudioUi';

export default function FindPartnersPage() {
  const available = partners.filter((partner) => partner.relationship !== 'partnered');
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Discover"
        title="Find partners"
        description="Browse verified venue and host profiles, credibility signals and public work history."
      />
      <PromoterTabs
        active="find"
        items={[
          { label: 'Venues', value: 'venues', href: '/promoter/partners' },
          { label: 'Hosts', value: 'hosts', href: '/promoter/partners/hosts' },
          {
            label: 'Find partners',
            value: 'find',
            href: '/promoter/partners/find',
            count: available.length,
          },
        ]}
      />
      <div className="pr-filterbar">
        <label>
          <span>Search partners</span>
          <input type="search" placeholder="Name, city or category" />
        </label>
        <SegmentedControl label="Type" options={['All', 'Venues', 'Hosts']} />
      </div>
      <section className="pr-partner-grid">
        {available.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </section>
    </div>
  );
}
