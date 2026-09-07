import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  normalizePartnerRole,
  resolvePartnerV3Path,
} from '@/components/partner-shell/partner-role-routing';
import { getActiveOrgId, setActiveOrg } from '@/lib/org/active-org';
import { getOrganizations } from '@/lib/org/org-repository';

import type { OrganizationDto } from '@c1rcle/contracts';

export default function SelectOrganizationPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeOrgId = getActiveOrgId();

  useEffect(() => {
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
          void setActiveOrg(singleOrg.id).then(() => {
            const role = normalizePartnerRole(singleOrg.role);
            const target = resolvePartnerV3Path(role, 'overview') ?? '/venue';
            router.replace(target);
          });
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
  }, [router]);

  const handleSelectOrg = async (org: OrganizationDto) => {
    await setActiveOrg(org.id);
    const role = normalizePartnerRole(org.role);
    const fallbackRoute = resolvePartnerV3Path(role, 'overview') ?? '/venue';
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

