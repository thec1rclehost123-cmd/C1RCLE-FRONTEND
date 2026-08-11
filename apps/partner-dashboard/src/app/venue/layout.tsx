import { DashboardAuthProvider } from '@/components/providers/DashboardAuthProvider';
import { VenueDashboardLayout } from '@/components/venue/VenueDashboardLayout';

import './venue.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Venue Studio',
  description: 'Run your nights — events, guests, partners, marketing and payouts.',
};

export default function VenueLayout({ children }: { readonly children: ReactNode }) {
  return (
    <DashboardAuthProvider>
      <VenueDashboardLayout>{children}</VenueDashboardLayout>
    </DashboardAuthProvider>
  );
}
