import { StatusBadge } from '@/components/partner-shell/DashboardUi';

import type { PromoterNetworkProfileData } from '@/lib/partner/contracts';

export function PromoterNetworkProfile({ data }: { readonly data: PromoterNetworkProfileData }) {
  const { profile, stats, recentCollaborators } = data;
  return (
    <article className="promoter-network-profile pd-surface">
      <header className="promoter-network-identity">
        <div className="promoter-profile-avatar"><span>{profile.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span></div>
        <div><div className="promoter-network-name"><h2>{profile.name}</h2>{profile.verified ? <StatusBadge tone="positive">Verified promoter</StatusBadge> : null}</div><p>{profile.handle} · {profile.city}</p><blockquote>{profile.bio}</blockquote></div>
      </header>
      <section className="promoter-network-stats" aria-label="Promoter collaboration performance">
        <div><strong>{stats.ticketsMoved.toLocaleString('en-IN')}</strong><span>Tickets moved</span><small>active fixture window</small></div>
        <div><strong>{stats.trackedConversion.toFixed(1)}%</strong><span>Tracked conversion</span><small>visits to ticket orders</small></div>
        <div><strong>{stats.eventsPromoted}</strong><span>Events promoted</span><small>verified history</small></div>
        <div><strong>{stats.audienceReach.toLocaleString('en-IN')}</strong><span>Audience reach</span><small>declared social following</small></div>
        <div><strong>{stats.repeatPartners}</strong><span>Repeat partners</span><small>2+ events together</small></div>
        <div><strong>{stats.typicalResponse}</strong><span>Typical response</span><small>recent partner average</small></div>
      </section>
      <section className="promoter-network-details">
        <div><span>Best-fit rooms</span><div className="promoter-profile-tags">{profile.categories.map((category) => <b key={category}>{category}</b>)}</div></div>
        <div><span>Recent collaborators</span><ul>{recentCollaborators.map((partner) => <li key={partner.id}><strong>{partner.name}</strong><small>{partner.kind} · {partner.eventsTogether} events together</small></li>)}</ul></div>
      </section>
      <footer><span>Private Partner Network profile</span><p>Revenue, commissions, payouts and earnings are never visible on this profile.</p></footer>
    </article>
  );
}
