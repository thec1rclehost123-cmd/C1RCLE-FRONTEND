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
  { label: 'Proposals', href: '/proposals' },
  { label: 'Onboarding', href: '/onboarding' },
  { label: 'Refunds', href: '/refunds' },
  { label: 'Payouts', href: '/payouts' },
  { label: 'Venues', href: '/venues' },
  { label: 'Events', href: '/events' },
  { label: 'Users', href: '/users' },
  { label: 'Hosts', href: '/hosts' },
  { label: 'Admins', href: '/admins' },
  { label: 'Audit', href: '/audit' },
];
