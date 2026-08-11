'use client';

import { PartnerDashboardLayout } from '@/components/partner-shell/PartnerDashboardLayout';

import type { ReactNode } from 'react';

export function PromoterDashboardLayout({ children }: { readonly children: ReactNode }) {
  return (
    <PartnerDashboardLayout partnerRole="promoter">
      <div className="promoter-studio">{children}</div>
    </PartnerDashboardLayout>
  );
}
