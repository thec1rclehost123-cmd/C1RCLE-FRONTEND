import './host.css';

import { Archivo } from 'next/font/google';

import { HostDashboardLayout } from '@/components/host/HostDashboardLayout';
import { DashboardAuthProvider } from '@/components/providers/DashboardAuthProvider';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-host-dashboard',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Host Studio | THE C1RCLE',
  description: 'Manage hosted experiences, partners, audience momentum, and settlements.',
};

export default function HostLayout({ children }: { readonly children: ReactNode }) {
  return (
    <DashboardAuthProvider>
      <div className={archivo.variable}>
        <HostDashboardLayout>{children}</HostDashboardLayout>
      </div>
    </DashboardAuthProvider>
  );
}
