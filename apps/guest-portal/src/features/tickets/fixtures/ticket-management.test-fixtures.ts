import type { UserTicketItem } from '../types/tickets.types';
import type { ManagedTicket } from '@c1rcle/contracts';

export const CODE = {
  qrPayload: 'ENT-rsvp-1:1791800000:deadbeefdeadbeef',
  expiresAt: '2026-12-10T12:00:30.000Z',
  refreshIntervalSec: 30,
};

export const TRANSFER = {
  id: 'TRF-test-1',
  entitlementId: 'ENT-rsvp-1',
  eventId: 'EVT-test-1',
  status: 'pending',
  expiresAt: '2026-12-10T12:00:00.000Z',
  acceptedAt: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-12-10T11:00:00.000Z',
  updatedAt: '2026-12-10T11:00:00.000Z',
} as const;

export const TICKET: UserTicketItem = {
  id: 'ENT-rsvp-1',
  eventId: 'EVT-test-1',
  orderId: 'ord_rsvp_1',
  eventTitle: 'RSVP Night',
  date: 'Saturday, Aug 16, 2026',
  time: '10:00 PM IST',
  venueName: 'BAYVIEW CLUB',
  city: 'MUMBAI',
  posterUrl: '/c1rcle-logo.webp',
  tierName: 'VIP ACCESS',
  isVip: true,
  ticketCount: 2,
  status: 'active',
  bookingReference: null,
  holderName: 'Guest',
};

export const MANAGEMENT: ManagedTicket = {
  id: TICKET.id,
  orderId: TICKET.orderId,
  eventId: TICKET.eventId,
  eventStatus: 'published',
  tierId: 'tier-vip',
  tierName: TICKET.tierName,
  holderName: TICKET.holderName,
  ownership: 'you',
  unitKind: 'paid',
  status: 'active',
  eventTitle: TICKET.eventTitle,
  eventSlug: null,
  startsAt: '2026-12-10T20:00:00.000Z',
  endsAt: null,
  posterUrl: null,
  bookingReference: null,
  canRequestRefund: true,
  refundUnavailableReason: null,
  refundReview: null,
  canPresent: true,
  qrUnavailableReason: null,
  venueId: null,
  venueName: null,
  venueCity: null,
  canTransfer: true,
  transferUnavailableReason: null,
  pendingTransfer: null,
};
