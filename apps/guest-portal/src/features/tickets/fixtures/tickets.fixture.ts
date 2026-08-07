// FIXTURE_ONLY: Temporary UI development ticket data fixture.
// Must not be used as a production API fallback.

import type { TicketShowcaseItem, TicketWalletData } from '../types/tickets.types';

export const ticketsFixture: {
  headline: string;
  tagline: string;
  items: TicketShowcaseItem[];
  userWallet: TicketWalletData;
} = {
  headline: 'YOUR PASS TO THE CIRCLE',
  tagline:
    'Secure your spot at exclusive events. Your digital wallet for instant access, live updates, and effortless entry.',
  items: [
    {
      id: 1,
      title: 'GENERAL',
      price: '₹1,500',
      type: 'Standard',
    },
    {
      id: 2,
      title: 'STAG',
      price: '₹2,500',
      type: 'Single Entry',
    },
    {
      id: 3,
      title: 'VIP',
      price: '₹5,000',
      type: 'Priority Access',
      isPopular: true,
    },
    {
      id: 4,
      title: 'COUPLE',
      price: '₹6,500',
      type: 'Pair Pass',
    },
    {
      id: 5,
      title: 'GROUP',
      price: '₹12,000',
      type: 'Group Entry',
    },
  ],
  userWallet: {
    pendingReservation: {
      id: 'res_99812',
      eventId: 'evt_solar_01',
      eventTitle: 'SOLARIS: ROOFTOP SESSIONS',
      expiresInMinutes: 8,
    },
    upcomingTickets: [
      {
        id: 'fixture-ticket-001-not-issued',
        orderId: 'fixture-order-001-not-created',
        eventTitle: 'AFTER HOURS: TECHNO RITUAL',
        date: 'Saturday, Aug 16, 2026',
        time: '10:00 PM IST',
        venueName: 'BAYVIEW CLUB',
        city: 'MUMBAI',
        posterUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop',
        tierName: 'VIP ACCESS',
        isVip: true,
        ticketCount: 2,
        qrPayload: 'NOT_VALID_FOR_ENTRY_FIXTURE_ONLY',
        status: 'active',
      },
      {
        id: 'fixture-ticket-002-not-issued',
        orderId: 'fixture-order-002-not-created',
        eventTitle: 'NEON RITUAL VOL. 3',
        date: 'Friday, Aug 22, 2026',
        time: '09:00 PM IST',
        venueName: 'THE WAREHOUSE',
        city: 'PUNE',
        posterUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop',
        tierName: 'GENERAL ADMISSION',
        isVip: false,
        ticketCount: 1,
        qrPayload: 'NOT_VALID_FOR_ENTRY_FIXTURE_ONLY',
        status: 'active',
      },
    ],
    pastTickets: [
      {
        id: 'fixture-ticket-003-not-issued',
        orderId: 'fixture-order-003-not-created',
        eventTitle: 'KINETIC NIGHTS VOL. 4',
        date: 'Friday, Jul 11, 2026',
        time: '10:00 PM IST',
        venueName: 'CLUB HYPNOTIC',
        city: 'BENGALURU',
        posterUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop',
        tierName: 'COUPLE PASS',
        isVip: false,
        ticketCount: 2,
        qrPayload: 'NOT_VALID_FOR_ENTRY_FIXTURE_ONLY',
        status: 'used',
      },
    ],
  },
};
