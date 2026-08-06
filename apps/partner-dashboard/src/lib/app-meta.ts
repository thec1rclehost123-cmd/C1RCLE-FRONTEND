/**
 * Application identity.
 *
 * Each application owns its own navigation and title. These deliberately do
 * NOT live in a shared package: they are the one thing that must differ
 * between the three deployments.
 */
export const APP_TITLE = 'C1RCLE Partner Dashboard';

export interface NavItem {
  readonly label: string;
  readonly href: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Overview', href: '/' },
  { label: 'Venues', href: '/venues' },
  { label: 'Bookings', href: '/bookings' },
];
