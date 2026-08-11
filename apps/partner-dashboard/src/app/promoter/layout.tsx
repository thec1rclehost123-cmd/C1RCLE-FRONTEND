import { Archivo } from 'next/font/google';

import { PromoterDashboardLayout } from '@/components/promoter/PromoterDashboardLayout';

import './promoter.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-archivo',
});

export const metadata: Metadata = {
  title: 'Promoter Studio',
  description: 'Move tickets, manage event partnerships and understand campaign performance.',
};

export default function PromoterLayout({ children }: { readonly children: ReactNode }) {
  return <div className={archivo.variable}><PromoterDashboardLayout>{children}</PromoterDashboardLayout></div>;
}
