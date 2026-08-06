// FIXTURE_ONLY: Temporary UI development tickets view models.

export type TicketCategory = 'GENERAL' | 'STAG' | 'VIP' | 'COUPLE' | 'GROUP';
export type TicketTab = 'upcoming' | 'past';
export type TicketStatus = 'active' | 'used' | 'cancelled' | 'pending';

export interface TicketShowcaseItem {
  id: number;
  title: TicketCategory;
  price: string;
  type: string;
  isPopular?: boolean;
}

export interface UserTicketItem {
  id: string;
  orderId: string;
  eventTitle: string;
  date: string;
  time: string;
  venueName: string;
  city: string;
  posterUrl: string;
  tierName: string;
  isVip?: boolean;
  ticketCount: number;
  qrPayload: string;
  status: TicketStatus;
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
