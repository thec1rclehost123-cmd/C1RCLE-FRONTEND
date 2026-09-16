/**
 * Application identity.
 *
 * Each application owns its own navigation and title. These deliberately do
 * NOT live in a shared package: they are the one thing that must differ
 * between the three deployments.
 */
export const APP_TITLE = 'C1RCLE Admin Console';

export interface NavItem {
  readonly label: string;
  readonly href: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Overview', href: '/' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Lookup', href: '/lookup' },
  { label: 'Proposals', href: '/proposals' },
  { label: 'Onboarding', href: '/onboarding' },
  { label: 'KYC review', href: '/kyc-review' },
  { label: 'Orders', href: '/orders' },
  { label: 'Tickets', href: '/tickets' },
  { label: 'Promotions', href: '/promotions' },
  { label: 'Promoters', href: '/promoters' },
  { label: 'Refunds', href: '/refunds' },
  { label: 'Disputes', href: '/disputes' },
  { label: 'Payouts', href: '/payouts' },
  { label: 'Venues', href: '/venues' },
  { label: 'Events', href: '/events' },
  { label: 'Users', href: '/users' },
  { label: 'Hosts', href: '/hosts' },
  { label: 'Admins', href: '/admins' },
  { label: 'Audit', href: '/audit' },
  { label: 'Health', href: '/health' },
  { label: 'Settings', href: '/settings' },
];
