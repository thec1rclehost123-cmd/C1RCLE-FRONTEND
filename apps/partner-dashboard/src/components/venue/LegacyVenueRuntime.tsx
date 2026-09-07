'use client';

import { PartnerDashboardLayout } from '@/components/partner-shell/PartnerDashboardLayout';

import { CalendarModal } from './modals/CalendarModal';
import { FloatingCalendar } from './modals/FloatingCalendar';
import { VenueStudioProvider } from './store';

import type { ReactNode } from 'react';

export function LegacyVenueRuntime({ children }: { readonly children: ReactNode }) {
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
