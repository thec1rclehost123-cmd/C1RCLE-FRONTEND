'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { normalizePartnerRole } from '@/components/partner-shell/partner-role-routing';
import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import { lastPathSegment, visibilityKeyForSegment } from '@/lib/access/studio-tab-access';
import { getStudioConfig, type StudioRole } from '@/studios/studio-config';

import { PageContainer } from './PagePrimitives';
import { PartnerShell } from './PartnerShell';
import { EmptyState, LoadingState } from './States';

import type { PartnerShellInteractionData } from '@/data/partner-data-source';

export function PartnerStudioFrame({
  studio,
  interactionData,
  children,
}: {
  readonly studio: StudioRole;
  readonly interactionData: PartnerShellInteractionData;
  readonly children: ReactNode;
}) {
  const auth = useDashboardAuth();
  const router = useRouter();
  const pathname = usePathname();
  const config = getStudioConfig(studio);
  const activeRole = normalizePartnerRole(auth.profile?.activeMembership?.partnerType);
  // Direct-URL guard matching the sidebar: a tab the backend's per-role
  // matrix withholds renders a no-access state instead of firing APIs that
  // would only 403. Null access (still loading) stays fail-open.
  const segment = lastPathSegment(pathname);
  const visibilityKey = visibilityKeyForSegment(segment);
  const tabLabel =
    config.navigation.find((item) => item.href === pathname || pathname.startsWith(`${item.href}/`))?.label ?? segment;
  const tabWithheld =
    visibilityKey !== null &&
    auth.tabVisibility !== null &&
    auth.tabVisibility[visibilityKey] === false;

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!auth.isApproved) {
      router.replace('/onboard');
      return;
    }
    if (!activeRole) router.replace('/partner/select-organization');
  }, [activeRole, auth.isApproved, auth.loading, auth.user, pathname, router]);

  if (auth.loading) {
    return (
      <PartnerShell studio={studio} interactionData={interactionData}>
        <LoadingState label="Authorizing Partner V3" />
      </PartnerShell>
    );
  }

  if (!auth.user || !auth.isApproved || !activeRole) {
    return <LoadingState label="Redirecting to your workspace" />;
  }

  return (
    <PartnerShell studio={studio} interactionData={interactionData}>
      {activeRole !== studio ? (
        <PageContainer>
          <EmptyState
            title={`${config.label} is not available for this account`}
            description={`This authenticated account belongs to ${getStudioConfig(activeRole).label}. Choose that workspace to continue.`}
          />
        </PageContainer>
      ) : tabWithheld ? (
        <PageContainer>
          <EmptyState
            title={`${tabLabel} isn't available for your role`}
            description="Your current access doesn't include this section. Ask an owner or admin to change your role if you need it."
          />
        </PageContainer>
      ) : (
        children
      )}
    </PartnerShell>
  );
}
