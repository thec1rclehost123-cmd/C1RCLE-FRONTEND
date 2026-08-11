'use client';

import { usePathname } from 'next/navigation';

import { PartnerDashboardLayout } from '@/components/partner-shell/PartnerDashboardLayout';

import { CalendarModal } from './modals/CalendarModal';
import { FloatingCalendar } from './modals/FloatingCalendar';
import { VenueStudioProvider } from './store';

import type { ReactNode } from 'react';

export function VenueDashboardLayout({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();

  if (
    pathname === '/venue/overview' ||
    pathname === '/venue/events' ||
    pathname === '/venue/events/analytics'
  ) {
    return (
      <PartnerDashboardLayout partnerRole="venue">
        <div className="venue-studio venue-route">{children}</div>
      </PartnerDashboardLayout>
    );
  }

  return (
    <VenueStudioProvider>
      <PartnerDashboardLayout partnerRole="venue">
        <div className="venue-studio venue-route">{children}</div>
      </PartnerDashboardLayout>
      <CalendarModal />
      <FloatingCalendar />
    </VenueStudioProvider>
  );
}
