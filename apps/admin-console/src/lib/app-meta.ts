/**
 * Application identity.
 *
 * Each application owns its own navigation and title. These deliberately do
 * NOT live in a shared package: they are the one thing that must differ
 * between the three deployments.
 */
export const APP_TITLE = 'C1RCLE Admin Console';
export const APP_SHORT_TITLE = 'Admin';

export interface NavItem {
  readonly label: string;
  readonly href: string;
  /** Key into the icon map in app-shell.tsx — keeps this file framework-free. */
  readonly icon: string;
}

export interface NavSection {
  readonly label: string;
  readonly items: readonly NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Overview', href: '/', icon: 'dashboard' },
      { label: 'Analytics', href: '/analytics', icon: 'trend' },
      { label: 'Lookup', href: '/lookup', icon: 'search' },
    ],
  },
  {
    label: 'Approvals',
    items: [
      { label: 'Proposals', href: '/proposals', icon: 'approved' },
      { label: 'Onboarding', href: '/onboarding', icon: 'invite' },
      { label: 'KYC review', href: '/kyc-review', icon: 'compliance' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Orders', href: '/orders', icon: 'order' },
      { label: 'Tickets', href: '/tickets', icon: 'ticket' },
      { label: 'Promotions', href: '/promotions', icon: 'announcement' },
      { label: 'Promoters', href: '/promoters', icon: 'users' },
      { label: 'Commissions', href: '/commissions', icon: 'wallet' },
    ],
  },
  {
    label: 'Care',
    items: [
      { label: 'Support', href: '/support', icon: 'notification' },
      { label: 'Refunds', href: '/refunds', icon: 'refund' },
      { label: 'Disputes', href: '/disputes', icon: 'warning' },
      { label: 'Payouts', href: '/payouts', icon: 'bank' },
    ],
  },
  {
    label: 'Directory',
    items: [
      { label: 'Venues', href: '/venues', icon: 'location' },
      { label: 'Events', href: '/events', icon: 'calendar' },
      { label: 'Users', href: '/users', icon: 'guest' },
      { label: 'Hosts', href: '/hosts', icon: 'partner' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Admins', href: '/admins', icon: 'admin' },
      { label: 'Audit', href: '/audit', icon: 'list' },
      { label: 'Health', href: '/health', icon: 'signal' },
      { label: 'Settings', href: '/settings', icon: 'settings' },
    ],
  },
];

export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);
