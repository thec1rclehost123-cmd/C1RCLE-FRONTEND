import type { PartnerAccessDto } from '@c1rcle/contracts';
import type { ReactNode } from 'react';

export type PartnerDashboardRole = 'venue' | 'host' | 'promoter';

/** Real server-side partner permissions (see `partner-access.ts`); the nav
 * gate on a tab must be one of these or absent — an invented string would
 * typecheck as nothing and silently hide the tab from everyone, including
 * the OWNER. */
export type PartnerPermission = PartnerAccessDto['permissions'][number];

export interface PartnerNavigationItem {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
  readonly match?: 'exact' | 'prefix';
  readonly permission?: PartnerPermission;
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
