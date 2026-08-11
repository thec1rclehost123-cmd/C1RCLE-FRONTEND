import './host.css';

import { Archivo } from 'next/font/google';

import { HostDashboardLayout } from '@/components/host/HostDashboardLayout';

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
  return <div className={archivo.variable}><HostDashboardLayout>{children}</HostDashboardLayout></div>;
}
