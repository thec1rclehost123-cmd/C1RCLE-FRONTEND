'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { normalizePartnerRole } from '@/components/partner-shell/partner-role-routing';
import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { LoadingState } from './States';

export function PartnerAccessEntry() {
  const auth = useDashboardAuth();
  const router = useRouter();
  const role = normalizePartnerRole(auth.profile?.activeMembership?.partnerType);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user || auth.isBanned) {
      router.replace('/login');
      return;
    }
    if (!auth.isApproved || !role) {
      router.replace('/partner/select-organization');
      return;
    }
    router.replace(`/partner/${role}/overview`);
  }, [auth.isApproved, auth.isBanned, auth.loading, auth.user, role, router]);

  return <LoadingState label="Opening your workspace" />;
}
