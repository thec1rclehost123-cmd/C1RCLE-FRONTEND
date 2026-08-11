import type { ReactNode } from 'react';

export type PartnerDashboardRole = 'venue' | 'host' | 'promoter';

export interface PartnerNavigationItem {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
  readonly match?: 'exact' | 'prefix';
  readonly permission?: string;
}

export interface PartnerShellConfig {
  readonly role: PartnerDashboardRole;
  readonly eyebrow: string;
  readonly navigation: readonly PartnerNavigationItem[];
  readonly primaryAction: {
    readonly label: string;
    readonly href: string;
    readonly icon: string;
  };
}

export interface PartnerDashboardLayoutProps {
  readonly partnerRole: PartnerDashboardRole;
  readonly children: ReactNode;
}
