export type VenueNotificationCategory = 'all' | 'events' | 'partners' | 'finance' | 'system';

export interface VenueNotificationRecord {
  readonly id: string;
  readonly category: Exclude<VenueNotificationCategory, 'all'>;
  readonly title: string;
  readonly summary: string;
  readonly time: string;
  readonly unread: boolean;
  readonly destination: string | null;
}

export const venueNotifications: readonly VenueNotificationRecord[] = [
  {
    id: 'slot-request',
    category: 'events',
    title: 'New slot request',
    summary: 'Rhea Kapoor requested a date for Neon Nights: Afrobeats.',
    time: '10:24 AM',
    unread: true,
    destination: '/venue/slot-requests',
  },
  {
    id: 'payout-completed',
    category: 'finance',
    title: 'Payout completed',
    summary: 'A venue payout is ready to review.',
    time: '9:41 AM',
    unread: true,
    destination: '/venue/finance',
  },
  {
    id: 'inventory-low',
    category: 'events',
    title: 'Event inventory low',
    summary: 'Neon Nights: Afrobeats has limited Couple Pass inventory.',
    time: '9:15 AM',
    unread: true,
    destination: '/venue/events/neon-nights-afrobeats',
  },
  {
    id: 'campaign-scheduled',
    category: 'system',
    title: 'Campaign scheduled',
    summary: 'A Neon Nights campaign is scheduled.',
    time: 'Yesterday, 4:30 PM',
    unread: false,
    destination: '/venue/marketing/history',
  },
  {
    id: 'staff-access',
    category: 'partners',
    title: 'Staff access changed',
    summary: 'Venue team access was updated.',
    time: 'Yesterday, 11:08 AM',
    unread: false,
    destination: '/venue/settings/team',
  },
];

export const filterVenueNotifications = (
  category: VenueNotificationCategory,
): readonly VenueNotificationRecord[] =>
  category === 'all'
    ? venueNotifications
    : venueNotifications.filter((notification) => notification.category === category);
