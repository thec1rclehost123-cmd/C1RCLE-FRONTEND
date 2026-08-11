import { getVenueEventDetailRecord } from './event-detail-model';

export type DoorTab = 'scanner' | 'guests' | 'walk-ins';
export type DoorGuestFilter = 'all' | 'pending' | 'checked-in' | 'vip';
export type DoorScanState =
  | {
      readonly type: 'success';
      readonly guest: string;
      readonly quantity: number;
      readonly ticket: string;
    }
  | { readonly type: 'invalid' }
  | { readonly type: 'duplicate'; readonly checkedInAt: string }
  | { readonly type: 'permission' }
  | { readonly type: 'offline' };

export interface DoorGuest {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
  readonly orderId: string;
  readonly ticketType: string;
  readonly quantity: number;
  readonly checkedIn: boolean;
  readonly checkedInAt: string | null;
  readonly vip: boolean;
}

export interface DoorWalkIn {
  readonly id: string;
  readonly name: string;
  readonly ticketType: string;
  readonly quantity: number;
  readonly amountPaise: number;
  readonly time: string;
}

export interface DoorModeModel {
  readonly event: {
    readonly id: string;
    readonly name: string;
    readonly venue: string;
    readonly dateTime: string;
    readonly posterSrc: string;
  };
  readonly totals: {
    readonly issued: number;
    readonly checkedIn: number;
    readonly remaining: number;
    readonly capacity: number;
  };
  readonly guests: readonly DoorGuest[];
  readonly walkIns: readonly DoorWalkIn[];
  readonly ticketTypes: readonly {
    readonly id: string;
    readonly name: string;
    readonly pricePaise: number;
  }[];
}

export interface DoorCheckInResult {
  readonly guestId: string;
  readonly checkedInAt: string;
}

export interface DoorWalkInResult {
  readonly ticketNumber: string;
  readonly amountPaise: number;
  readonly paymentMethod: 'UPI' | 'Card' | 'Cash';
}

export interface DoorModeAdapters {
  readonly startScanner?: (
    onResult: (state: DoorScanState) => void,
  ) => Promise<(() => void) | undefined>;
  readonly verifyManualCode?: (code: string) => Promise<DoorScanState>;
  readonly checkIn?: (guestId: string) => Promise<DoorCheckInResult>;
  readonly undoCheckIn?: (guestId: string) => Promise<void>;
  readonly createWalkIn?: (input: {
    readonly ticketTypeId: string;
    readonly quantity: number;
    readonly name: string;
    readonly phone: string;
    readonly paymentMethod: 'UPI' | 'Card' | 'Cash';
  }) => Promise<DoorWalkInResult>;
  readonly sendTicket?: (ticketNumber: string) => Promise<void>;
}

export const formatDoorCurrency = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);

export const filterDoorGuests = (
  guests: readonly DoorGuest[],
  query: string,
  filter: DoorGuestFilter,
): readonly DoorGuest[] => {
  const normalized = query.trim().toLocaleLowerCase('en-IN');
  return guests.filter((guest) => {
    const matchesQuery =
      !normalized ||
      `${guest.name} ${guest.phone} ${guest.orderId}`
        .toLocaleLowerCase('en-IN')
        .includes(normalized);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && !guest.checkedIn) ||
      (filter === 'checked-in' && guest.checkedIn) ||
      (filter === 'vip' && guest.vip);
    return matchesQuery && matchesFilter;
  });
};

export const getDoorModeModel = (eventId = 'neon-nights-afrobeats'): DoorModeModel => {
  const record =
    getVenueEventDetailRecord(eventId) ?? getVenueEventDetailRecord('neon-nights-afrobeats');
  if (!record?.guests || !record.summary)
    throw new Error('Door Mode requires an event detail source.');
  const guests = record.guests.guests.map<DoorGuest>((guest, index) => ({
    id: guest.id,
    name: guest.name,
    initials: guest.initials,
    phone: guest.maskedPhone,
    orderId: `#SR-2025-${String(1181 + index)}`,
    ticketType: guest.ticketType === 'VIP Table' ? 'VIP' : 'General Entry',
    quantity: guest.ticketType === 'VIP Table' ? 2 : 1,
    checkedIn: guest.checkInStatus === 'Checked in',
    checkedInAt: guest.checkInDateTime,
    vip: guest.ticketType === 'VIP Table',
  }));
  const capacity = record.summary.ticketTypes.reduce((sum, tier) => sum + tier.capacity, 0);
  const checkedIn = record.guests.checkedIn;
  const issued = record.guests.issuedGuests;
  return {
    event: {
      id: record.header.id,
      name: record.header.name,
      venue: record.header.venue,
      dateTime: record.header.dateTimeLabel,
      posterSrc: record.header.posterSrc,
    },
    totals: {
      issued,
      checkedIn,
      remaining: Math.max(0, issued - checkedIn),
      capacity,
    },
    guests,
    ticketTypes: record.summary.ticketTypes.map((tier) => ({
      id: tier.name.toLocaleLowerCase('en-IN').replace(/\s+/g, '-'),
      name: tier.name,
      pricePaise: tier.pricePaise,
    })),
    walkIns: [
      {
        id: 'walkin-1',
        name: 'Rohan Mehta',
        ticketType: 'General Entry',
        quantity: 1,
        amountPaise: 129_900,
        time: '9:42 PM',
      },
      {
        id: 'walkin-2',
        name: 'Priya Sharma',
        ticketType: 'General Entry',
        quantity: 1,
        amountPaise: 129_900,
        time: '9:41 PM',
      },
      {
        id: 'walkin-3',
        name: 'Arjun Kapoor',
        ticketType: 'VIP',
        quantity: 1,
        amountPaise: 249_900,
        time: '9:39 PM',
      },
      {
        id: 'walkin-4',
        name: 'Neha Iyer',
        ticketType: 'General Entry',
        quantity: 1,
        amountPaise: 129_900,
        time: '9:36 PM',
      },
    ],
  };
};

export const doorModeModel = getDoorModeModel();
