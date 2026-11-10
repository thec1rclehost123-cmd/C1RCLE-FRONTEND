import type { EventWorkspaceTab } from './EventWorkspaceChrome';

export function eventTabs(studio: 'venue' | 'host', eventId: string): EventWorkspaceTab[] {
  const base = `/partner/${studio}/events/${encodeURIComponent(eventId)}`;
  return [
    {
      label: 'Sales',
      href: base,
      children: [
        { label: 'Summary', href: base },
        { label: 'Analytics', href: `${base}/analytics` },
        { label: 'Revenue', href: `${base}/revenue` },
        { label: 'Crowd', href: `${base}/guests` },
        { label: 'Live compare', href: `${base}/compare` },
      ],
    },
    {
      label: "Who's coming",
      href: `${base}/guests`,
      children: [
        { label: 'Attendees', href: `${base}/guests` },
        { label: 'Waitlist', href: `${base}/waitlist` },
      ],
    },
    {
      label: 'Tonight',
      href: `${base}/door`,
      children: [
        { label: 'Door mode', href: `${base}/door` },
        { label: 'Cover', href: `${base}/cover` },
      ],
    },
    { label: 'Promoters', href: `${base}/promoters` },
  ];
}
