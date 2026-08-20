import { PartnerDashboardLayout } from '@/components/partner-shell/PartnerDashboardLayout';

import type { ReactNode } from 'react';

export function HostDashboardLayout({ children }: { readonly children: ReactNode }) {
  return <PartnerDashboardLayout partnerRole="host">{children}</PartnerDashboardLayout>;
}
