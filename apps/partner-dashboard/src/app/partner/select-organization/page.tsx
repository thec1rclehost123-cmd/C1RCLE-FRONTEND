'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSessionStore } from '@c1rcle/auth';

import { normalizePartnerRole } from '@/components/partner-shell/partner-role-routing';
import { getActiveOrgId, setActiveOrg } from '@/lib/org/active-org';
import { getOrganizations } from '@/lib/org/org-repository';
import { resolveOrgOverviewPath } from '@/lib/org/route-after-auth';

import type { OrganizationDto } from '@c1rcle/contracts';

export default function SelectOrganizationPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeOrgId = getActiveOrgId();
  // Same token-hydration gate as useOrgAccess: on a fresh page load the session
  // starts authenticated with a null access token until `refresh()` resolves one
  // in the background (session-provider.tsx) — firing this any earlier 401s.
  // Gated on `hydrated` (settles once, either way) rather than `accessToken`
  // itself, so a later token loss falls through to the normal retry path
  // instead of blocking this effect forever.
  const hydrated = useSessionStore().hydrated;

  useEffect(() => {
    if (!hydrated) return;

    let isMounted = true;
    getOrganizations()
      .then((orgs) => {
        if (!isMounted) return;
        setOrganizations(orgs);
        setLoading(false);

        if (orgs.length === 0) {
          router.replace('/onboard');
        } else if (orgs.length === 1 && orgs[0]) {
          const singleOrg = orgs[0];
          void setActiveOrg(singleOrg.id)
            .then(() => resolveOrgOverviewPath(singleOrg.id))
            .then((target) => router.replace(target));
        }

      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load organizations. Please try again.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router, hydrated]);

  const handleSelectOrg = async (org: OrganizationDto) => {
    await setActiveOrg(org.id);
    // `org.role` is the caller's *staff* role (owner/admin/manager/member),
    // never the partner type — resolveOrgOverviewPath asks the real
    // per-org /access endpoint instead (same helper /login and the
    // onboarding approval hop use, so all three never drift apart).
    const fallbackRoute = await resolveOrgOverviewPath(org.id);
    const lastRoute =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(`partner:last-route:${org.id}`) ?? fallbackRoute
        : fallbackRoute;
    router.push(lastRoute);
  };

  if (loading) {
    return (
      <main className="partner-v3-organization">
        <section className="partner-v3-organization-panel">
          <span>THE C1RCLE · PARTNER</span>
          <h1>Loading your workspaces...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="partner-v3-organization">
      <section className="partner-v3-organization-panel">
        <span>THE C1RCLE · PARTNER</span>
        <h1>Choose your workspace.</h1>
        <p>
          Each organization keeps its own routes, permissions and cached data. You can switch again
          from the dashboard header.
        </p>

        {error && <p className="partner-v3-organization-error">{error}</p>}

        <div className="partner-v3-organization-list">
          {organizations.map((org) => {
            const role = normalizePartnerRole(org.role);
            const roleLabel = role ?? 'workspace';
            const selected = org.id === activeOrgId;
            return (
              <button
                type="button"
                key={org.id}
                className="partner-v3-organization-choice"
                onClick={() => void handleSelectOrg(org)}
              >
                <span>
                  {org.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div>
                  <strong>{org.name}</strong>
                  <small>
                    {roleLabel} · {org.role}
                  </small>
                </div>
                <b>{selected ? 'Active' : 'Select'}</b>
              </button>
            );
          })}
        </div>

        {organizations.length === 0 && !error ? (
          <div className="partner-v3-organization-missing" role="status">
            <strong>No active organization.</strong>
            <p>Complete onboarding or ask an owner to add your membership.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

