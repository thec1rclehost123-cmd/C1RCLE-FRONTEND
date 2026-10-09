import { PromoterDashboardLayout } from '@/components/promoter/PromoterDashboardLayout';
import { DashboardAuthProvider } from '@/components/providers/DashboardAuthProvider';

import './promoter.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Promoter Studio',
  description: 'Move tickets, manage event partnerships and understand campaign performance.',
};

export default function PromoterLayout({ children }: { readonly children: ReactNode }) {
  return (
    <DashboardAuthProvider>
      <div>
        <PromoterDashboardLayout>{children}</PromoterDashboardLayout>
      </div>
    </DashboardAuthProvider>
  );
}
