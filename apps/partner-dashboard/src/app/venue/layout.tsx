import { Archivo } from 'next/font/google';

import { VenueDashboardLayout } from '@/components/venue/VenueDashboardLayout';

import './venue.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-archivo',
});

export const metadata: Metadata = {
  title: 'Venue Studio',
  description: 'Run your nights — events, guests, partners, marketing and payouts.',
};

export default function VenueLayout({ children }: { readonly children: ReactNode }) {
  return <div className={archivo.variable}><VenueDashboardLayout>{children}</VenueDashboardLayout></div>;
}
