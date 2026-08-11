import { StatusBadge } from '@/components/partner-shell/DashboardUi';

import type { PartnerRelationship } from '@/lib/partner/contracts';

export function HostPartnerCard({ partner }: { readonly partner: PartnerRelationship }) {
  return (
    <article className="host-partner-card pd-surface">
      <div className="host-partner-avatar" aria-hidden="true">{partner.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div>
      <div className="host-partner-copy"><span>{partner.kind}{partner.verified ? ' · verified' : ''}</span><h2>{partner.name}</h2><p>{partner.city} · {partner.categories.join(' · ')}</p></div>
      <StatusBadge tone={partner.status === 'partnered' ? 'positive' : partner.status === 'pending' ? 'warning' : 'neutral'}>{partner.status}</StatusBadge>
      <dl><div><dt>{partner.eventsTogether}</dt><dd>Events together</dd></div><div><dt>{partner.responseTime}</dt><dd>Typical response</dd></div></dl>
      <button type="button" disabled title="Partner relationship mutations activate when the backend repository is connected">{partner.status === 'partnered' ? 'View relationship' : 'Request pending'}</button>
    </article>
  );
}
