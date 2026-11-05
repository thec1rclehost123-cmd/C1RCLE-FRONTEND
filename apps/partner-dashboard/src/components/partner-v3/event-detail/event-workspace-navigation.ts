import type { EventWorkspaceTab } from './EventWorkspaceChrome';

export function eventTabs(studio: 'venue' | 'host', eventId: string): EventWorkspaceTab[] {
  const base = `/partner/${studio}/events/${encodeURIComponent(eventId)}`;
  return [
    {
      label: 'Summary',
      href: base,
      children: [
        { label: 'Overview', href: base },
        { label: 'Analytics', href: `${base}/analytics` },
      ],
    },
    {
      label: 'Tickets & sales',
      href: `${base}/tickets`,
      children: [
        { label: 'Tickets', href: `${base}/tickets` },
        { label: 'Orders', href: `${base}/sales` },
        { label: 'Extras', href: `${base}/addons` },
      ],
    },
    {
      label: 'Guests',
      href: `${base}/guests`,
      children: [
        { label: 'Attendees', href: `${base}/guests` },
        { label: 'Waitlist', href: `${base}/waitlist` },
      ],
    },
    { label: 'Promoters', href: `${base}/promoters` },
    {
      label: 'Door & cover',
      href: `${base}/door`,
      children: [
        { label: 'Door', href: `${base}/door` },
        { label: 'Tonight', href: `${base}/tonight` },
        { label: 'Cover', href: `${base}/cover` },
      ],
    },
    {
      label: 'Settings',
      href: `${base}/access`,
      children: [
        { label: 'Access', href: `${base}/access` },
        { label: 'Edit event', href: `${base}/edit` },
      ],
    },
  ];
}
