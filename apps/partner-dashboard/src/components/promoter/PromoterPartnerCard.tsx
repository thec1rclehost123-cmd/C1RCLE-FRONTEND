import { StatusBadge } from '@/components/partner-shell/DashboardUi';

import { PromoterPartnershipAction } from './PromoterPartnershipAction';

import type { PromoterPartner } from '@/lib/partner/contracts';

const visualTone = (id: string): string => {
  if (id === 'docks') return 'teal';
  if (id === 'rhea') return 'pink';
  if (id === 'pulse') return 'violet';
  if (id === 'sonder') return 'amber';
  return 'orange';
};

export function PromoterPartnerCard({ partner }: { readonly partner: PromoterPartner }) {
  return (
    <article className="promoter-partner-card">
      <div className={`promoter-partner-art promoter-tone promoter-tone--${visualTone(partner.id)}`}><span>{partner.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span></div>
      <div className="promoter-partner-body">
        <div className="promoter-partner-title"><div><span>{partner.kind}{partner.verified ? ' · verified' : ''}</span><h3>{partner.name}</h3><p>{partner.city} · {partner.category}</p></div><StatusBadge tone={partner.status === 'partnered' ? 'positive' : partner.status === 'pending' ? 'warning' : 'neutral'}>{partner.status}</StatusBadge></div>
        <dl><div><dt>{partner.eventsTogether}</dt><dd>Events together</dd></div><div><dt>{partner.responseTime}</dt><dd>Typical response</dd></div></dl>
        <footer><PromoterPartnershipAction partner={partner} /></footer>
      </div>
    </article>
  );
}
