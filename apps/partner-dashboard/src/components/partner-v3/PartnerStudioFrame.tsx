'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { normalizePartnerRole } from '@/components/partner-shell/partner-role-routing';
import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import { getStudioConfig, type StudioRole } from '@/studios/studio-config';

import { PageContainer } from './PagePrimitives';
import { PartnerShell } from './PartnerShell';
import { EmptyState, LoadingState } from './States';

import type { PartnerShellInteractionData } from '@/data/partner-data-source';

export function PartnerStudioFrame({ studio, interactionData, children }: { readonly studio: StudioRole; readonly interactionData: PartnerShellInteractionData; readonly children: ReactNode }) {
  const auth = useDashboardAuth();
  const router = useRouter();
  const pathname = usePathname();
  const config = getStudioConfig(studio);
  const activeRole = normalizePartnerRole(auth.profile?.activeMembership?.partnerType);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user || auth.isBanned) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!auth.isApproved) {
      router.replace('/onboard');
      return;
    }
    if (!activeRole) router.replace('/partner/select-organization');
  }, [activeRole, auth.isApproved, auth.isBanned, auth.loading, auth.user, pathname, router]);

  if (auth.loading) {
    return <PartnerShell studio={studio} interactionData={interactionData}><LoadingState label="Authorizing Partner V3" /></PartnerShell>;
  }

  if (!auth.user || auth.isBanned || !auth.isApproved || !activeRole) {
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
      ) : children}
    </PartnerShell>
  );
}
