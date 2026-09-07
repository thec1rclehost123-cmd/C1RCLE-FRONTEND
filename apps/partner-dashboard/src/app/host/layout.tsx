import './host.css';

import { HostDashboardLayout } from '@/components/host/HostDashboardLayout';
import { DashboardAuthProvider } from '@/components/providers/DashboardAuthProvider';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Host Studio | THE C1RCLE',
  description: 'Manage hosted experiences, partners, audience momentum, and settlements.',
};

export default function HostLayout({ children }: { readonly children: ReactNode }) {
  return (
    <DashboardAuthProvider>
      <HostDashboardLayout>{children}</HostDashboardLayout>
    </DashboardAuthProvider>
  );
}
