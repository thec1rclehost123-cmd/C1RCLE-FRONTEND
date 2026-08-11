'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './EventDetailLayout.module.css';

export interface EventDetailTabDestination {
  readonly label: 'Summary' | 'Sales' | 'Guests' | 'Promoters' | 'Marketing' | 'Finance';
  readonly href: string;
}

export const buildEventDetailTabDestinations = (
  eventId: string,
): readonly EventDetailTabDestination[] => {
  const base = `/venue/events/${eventId}`;
  return [
    { label: 'Summary', href: base },
    { label: 'Sales', href: `${base}/sales` },
    { label: 'Guests', href: `${base}/guests` },
    { label: 'Promoters', href: `${base}/promoters` },
    { label: 'Marketing', href: `${base}/marketing` },
    { label: 'Finance', href: `${base}/finance` },
  ];
};

export function EventDetailTabs({ eventId }: { readonly eventId: string }) {
  const pathname = usePathname();
  const tabs = buildEventDetailTabDestinations(eventId);

  return (
    <nav className={styles['eventTabs']} aria-label="Event details">
      {tabs.map((tab) => {
        const selected = pathname === tab.href;
        return (
          <Link key={tab.label} href={tab.href} aria-current={selected ? 'page' : undefined}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
