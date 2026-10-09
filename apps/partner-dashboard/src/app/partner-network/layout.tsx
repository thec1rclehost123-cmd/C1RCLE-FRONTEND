import { DashboardAuthProvider } from '@/components/providers/DashboardAuthProvider';

import '../promoter/promoter.css';

import type { ReactNode } from 'react';

export default function PartnerNetworkLayout({ children }: { readonly children: ReactNode }) {
  return (
    <DashboardAuthProvider>
      <div>{children}</div>
    </DashboardAuthProvider>
  );
}
