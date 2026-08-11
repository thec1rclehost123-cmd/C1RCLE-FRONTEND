'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

const normalizedRole = (role: string): 'venue' | 'host' | 'promoter' => role === 'club' ? 'venue' : role as 'venue' | 'host' | 'promoter';

export default function SelectOrganizationPage() {
  const auth = useDashboardAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.user) router.replace('/login');
  }, [auth.loading, auth.user, router]);

  const active = auth.profile?.activeMembership;
  const memberships = auth.memberships.length ? auth.memberships : active ? [active] : [];

  return <main className="partner-dashboard partner-organization-page"><section className="partner-organization-panel"><span>THE C1RCLE · PARTNER</span><h1>Choose your workspace.</h1><p>Each organization keeps its own routes, permissions and cached data. You can switch again from the dashboard header.</p><div>{memberships.map((membership) => { const role = normalizedRole(membership.partnerType); const selected = membership.partnerId === active?.partnerId; return <button type="button" key={membership.partnerId} onClick={() => { const lastRoute = window.localStorage.getItem(`partner:last-route:${membership.partnerId}`) ?? `/${role}/overview`; if (selected) router.push(lastRoute); else { window.localStorage.setItem(`partner:last-route:${membership.partnerId}`, lastRoute); void auth.switchPartner(membership.partnerId); } }}><span>{(membership.partnerName ?? role).split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()}</span><div><strong>{membership.partnerName ?? `${role} organization`}</strong><small>{role} · {membership.role}</small></div><b>{selected ? 'Continue' : 'Switch'}</b></button>; })}</div>{memberships.length === 0 ? <div className="partner-organization-missing" role="status"><strong>No active organization.</strong><p>Complete onboarding or ask an owner to add your membership.</p></div> : null}</section></main>;
}
