'use client';

import { PartnerDashboardLayout } from '@/components/partner-shell/PartnerDashboardLayout';

import { CalendarModal } from './modals/CalendarModal';
import { ComposerModal } from './modals/ComposerModal';
import { FloatingCalendar } from './modals/FloatingCalendar';
import { VenueStudioProvider } from './store';

import type { ReactNode } from 'react';

export function VenueDashboardLayout({ children }: { readonly children: ReactNode }) {
  return (
    <VenueStudioProvider>
      <PartnerDashboardLayout partnerRole="venue">
        <div className="venue-studio venue-route">{children}</div>
      </PartnerDashboardLayout>
      <CalendarModal />
      <ComposerModal />
      <FloatingCalendar />
    </VenueStudioProvider>
  );
}
