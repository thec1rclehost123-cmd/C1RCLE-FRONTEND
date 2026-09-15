'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import type { ReactNode } from 'react';

export function PartnerNetworkAccess({ children }: { readonly children: ReactNode }) {
  const auth = useDashboardAuth();
  const router = useRouter();
  const activeRole = auth.profile?.activeMembership?.partnerType;

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user || !auth.isApproved) router.replace('/login');
  }, [auth.isApproved, auth.loading, auth.user, router]);

  if (auth.loading || !auth.user || !auth.isApproved) return <div className="partner-auth-splash" role="status">Authorizing Partner Network access</div>;

  return <div className={`partner-dashboard partner-network-page partner-network-page--${activeRole ?? 'partner'}`}><main className="partner-dashboard-content">{children}</main></div>;
}
