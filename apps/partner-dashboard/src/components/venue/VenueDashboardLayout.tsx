'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import { PartnerDashboardLayout } from '@/components/partner-shell/PartnerDashboardLayout';

import type { ReactNode } from 'react';

const LegacyVenueRuntime = dynamic(() =>
  import('./LegacyVenueRuntime').then((module) => module.LegacyVenueRuntime),
);

export function VenueDashboardLayout({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();

  const needsLegacyVenueState =
    /^\/venue\/events\/[^/]+(?:\/(?:guests|finance|marketing|promoters|sales))?$/.test(pathname);

  if (!needsLegacyVenueState) {
    return (
      <PartnerDashboardLayout partnerRole="venue">
        <div className="venue-studio venue-route">{children}</div>
      </PartnerDashboardLayout>
    );
  }

  return <LegacyVenueRuntime>{children}</LegacyVenueRuntime>;
}
