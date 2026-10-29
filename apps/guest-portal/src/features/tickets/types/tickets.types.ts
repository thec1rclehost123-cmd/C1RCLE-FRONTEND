// FIXTURE_ONLY: Temporary UI development tickets view models.

export type TicketCategory = 'GENERAL' | 'STAG' | 'VIP' | 'COUPLE' | 'GROUP';
export type TicketTab = 'upcoming' | 'past';
export type TicketStatus =
  'active' | 'used' | 'cancelled' | 'pending' | 'refund_pending' | 'refunded' | 'unavailable';

export interface TicketShowcaseItem {
  id: number;
  title: TicketCategory;
  price: string;
  type: string;
  isPopular?: boolean;
}

export interface UserTicketItem {
  id: string;
  eventId: string;
  orderId: string;
  bookingReference: string | null;
  holderName: string;
  eventTitle: string;
  date: string;
  time: string;
  venueName: string;
  city: string;
  posterUrl: string;
  tierName: string;
  isVip?: boolean;
  ticketCount: number;
  status: TicketStatus;
  /** An independently issued group unit that the purchaser may invite, but cannot present. */
  custody?: 'unassigned';
  ticketAddons?: readonly {
    id: string;
    name: string;
    kind: 'parking' | 'cloakroom' | 'merchandise';
    status: 'active' | 'redeemed' | 'void';
  }[];
  eventCover?: {
    status: string;
    issuedPaise: number;
    remainingPaise: number;
    reservedPaise: number;
    redeemedPaise: number;
    refundedPaise: number;
    history: readonly { type: string; amountPaise: number; createdAt: string }[];
  };
}

export interface PendingReservationAlert {
  id: string;
  eventId: string;
  eventTitle: string;
  expiresInMinutes: number;
}

export interface TicketWalletData {
  upcomingTickets: UserTicketItem[];
  pastTickets: UserTicketItem[];
  pendingReservation?: PendingReservationAlert;
}
