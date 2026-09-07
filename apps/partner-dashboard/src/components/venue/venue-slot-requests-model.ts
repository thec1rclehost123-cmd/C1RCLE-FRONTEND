export type SlotRequestStatus = 'pending' | 'accepted' | 'declined';
export type SlotRequestTab = SlotRequestStatus;

export interface VenueSlotRequest {
  readonly id: string;
  readonly eventName: string;
  readonly requester: string;
  readonly requesterInitials: string;
  readonly date: string;
  readonly time: string;
  readonly expectedGuests: number;
  readonly eventType: string;
  readonly submittedAt: string;
  readonly status: SlotRequestStatus;
  readonly note: string;
  readonly posterSrc: string;
  readonly history: readonly {
    readonly id: string;
    readonly eventName: string;
    readonly date: string;
    readonly status: 'accepted' | 'declined';
  }[];
}

export interface SlotRequestAdapters {
  readonly accept?: (requestId: string) => Promise<void>;
  readonly decline?: (requestId: string, reason: string | null) => Promise<void>;
  readonly suggestDate?: (
    requestId: string,
    input: { readonly date: string; readonly time: string; readonly note: string | null },
  ) => Promise<void>;
}

export const venueSlotRequests: readonly VenueSlotRequest[] = [
  {
    id: 'slot-sunset-4',
    eventName: 'Sunset Sessions Vol. 4',
    requester: 'Rhea Kapoor',
    requesterInitials: 'RK',
    date: 'Sat, 2 Aug 2025',
    time: '5:00 PM onwards',
    expectedGuests: 250,
    eventType: 'Afrobeats / Sundowner',
    submittedAt: 'Today · 10:24 AM',
    status: 'pending',
    note: 'A laid-back sunset party with Afrobeats, great vibes and good energy.',
    posterSrc: '/venue/events/sunset-sessions.webp',
    history: [
      {
        id: 'history-rooftop',
        eventName: 'Rooftop Afrobeats',
        date: 'Sat, 12 Apr 2025',
        status: 'accepted',
      },
      {
        id: 'history-christmas',
        eventName: 'Christmas Special',
        date: 'Wed, 25 Dec 2024',
        status: 'accepted',
      },
      {
        id: 'history-aero',
        eventName: 'AERO FUSION',
        date: 'Fri, 15 Nov 2024',
        status: 'declined',
      },
    ],
  },
  {
    id: 'slot-90s',
    eventName: 'Back to 90s',
    requester: 'Karan Shah',
    requesterInitials: 'KS',
    date: 'Fri, 8 Aug 2025',
    time: '9:00 PM onwards',
    expectedGuests: 300,
    eventType: '90s / Club Night',
    submittedAt: 'Yesterday · 4:45 PM',
    status: 'pending',
    note: 'A high-energy retro club night.',
    posterSrc: '/venue/events/bollywood-brunch.webp',
    history: [],
  },
  {
    id: 'slot-underground',
    eventName: 'Underground House',
    requester: 'DJ Akhtar',
    requesterInitials: 'DA',
    date: 'Sat, 16 Aug 2025',
    time: '11:00 PM onwards',
    expectedGuests: 200,
    eventType: 'House / Underground',
    submittedAt: 'Jul 15 · 2:18 PM',
    status: 'pending',
    note: 'Late-night house session for a focused dance-floor crowd.',
    posterSrc: '/venue/events/warehouse-rave.webp',
    history: [],
  },
  {
    id: 'slot-soulful',
    eventName: 'Soulful Sundays',
    requester: 'Ananya Mehta',
    requesterInitials: 'AM',
    date: 'Sun, 24 Aug 2025',
    time: '6:00 PM onwards',
    expectedGuests: 180,
    eventType: 'Soul / Live Set',
    submittedAt: 'Jul 14 · 11:07 AM',
    status: 'pending',
    note: 'Live soul and a relaxed Sunday format.',
    posterSrc: '/venue/events/monsoon-sessions.webp',
    history: [],
  },
  {
    id: 'slot-accepted',
    eventName: 'Disco Terrace',
    requester: 'Vikram Patel',
    requesterInitials: 'VP',
    date: 'Sat, 30 Aug 2025',
    time: '8:00 PM onwards',
    expectedGuests: 220,
    eventType: 'Disco / Terrace',
    submittedAt: 'Jul 12 · 9:14 AM',
    status: 'accepted',
    note: 'Approved terrace event.',
    posterSrc: '/venue/events/neon-nights.webp',
    history: [],
  },
  {
    id: 'slot-declined',
    eventName: 'Bass Assembly',
    requester: 'Nina Rao',
    requesterInitials: 'NR',
    date: 'Fri, 5 Sep 2025',
    time: '10:00 PM onwards',
    expectedGuests: 450,
    eventType: 'Bass / Club Night',
    submittedAt: 'Jul 10 · 3:22 PM',
    status: 'declined',
    note: 'Capacity exceeds the supported floor plan.',
    posterSrc: '/venue/events/warehouse-rave.webp',
    history: [],
  },
];

export const filterSlotRequests = (
  tab: SlotRequestTab,
  query: string,
): readonly VenueSlotRequest[] => {
  const normalized = query.trim().toLocaleLowerCase('en-IN');
  return venueSlotRequests.filter(
    (request) =>
      request.status === tab &&
      (!normalized ||
        `${request.eventName} ${request.requester} ${request.eventType}`
          .toLocaleLowerCase('en-IN')
          .includes(normalized)),
  );
};
