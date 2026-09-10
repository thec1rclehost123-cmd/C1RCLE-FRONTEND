'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import {
  normalizePartnerRole,
  resolvePartnerV3Path,
} from '@/components/partner-shell/partner-role-routing';
import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

export default function SelectOrganizationPage() {
  const auth = useDashboardAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.user) router.replace('/login');
  }, [auth.loading, auth.user, router]);

  const active = auth.profile?.activeMembership;
  const memberships = auth.memberships.length ? auth.memberships : active ? [active] : [];

  return (
    <main className="partner-v3-organization">
      <section className="partner-v3-organization-panel">
        <span>THE C1RCLE · PARTNER</span>
        <h1>Choose your workspace.</h1>
        <p>Each organization keeps its own routes, permissions and cached data. You can switch again from the dashboard header.</p>
        <div className="partner-v3-organization-list">
          {memberships.map((membership) => {
            const role = normalizePartnerRole(membership.partnerType);
            const roleLabel = role ?? 'workspace';
            const selected = membership.partnerId === active?.partnerId;
            const fallbackRoute = resolvePartnerV3Path(role, 'overview');
            return (
              <button
                type="button"
                key={membership.partnerId}
                disabled={!role}
                className="partner-v3-organization-choice"
                onClick={() => {
                  if (!role) return;
                  const lastRoute = window.localStorage.getItem(`partner:last-route:${membership.partnerId}`) ?? fallbackRoute ?? '/partner/select-organization';
                  if (selected) router.push(lastRoute);
                  else {
                    window.localStorage.setItem(`partner:last-route:${membership.partnerId}`, lastRoute);
                    void auth.switchPartner(membership.partnerId);
                  }
                }}
              >
                <span>{(membership.partnerName ?? roleLabel).split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{membership.partnerName ?? `${roleLabel} organization`}</strong>
                  <small>{roleLabel} · {membership.role}</small>
                </div>
                <b>{selected ? 'Continue' : 'Switch'}</b>
              </button>
            );
          })}
        </div>
        {memberships.length === 0 ? (
          <div className="partner-v3-organization-missing" role="status">
            <strong>No active organization.</strong>
            <p>Complete onboarding or ask an owner to add your membership.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
