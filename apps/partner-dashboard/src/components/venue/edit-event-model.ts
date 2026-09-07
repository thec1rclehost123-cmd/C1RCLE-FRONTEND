import { getVenueEventDetailRecord } from './event-detail-model';

import type { CreateEventDraft } from './create-event-model';

export const getEditEventDraft = (eventId: string): CreateEventDraft | null => {
  const record = getVenueEventDetailRecord(eventId);
  if (!record) return null;

  const tickets = record.sales?.ticketTypes ?? record.summary?.ticketTypes ?? [];
  const date = '2025-07-16';
  return {
    posterSrc: record.header.posterSrc,
    name: record.header.name,
    venueId: 'skyline-rooftop',
    venueName: record.header.venue,
    venueAddress: record.summary?.information.address ?? 'Bandra West, Mumbai',
    venueCapacity: tickets.reduce((total, ticket) => total + ticket.capacity, 0) || 400,
    date,
    dateLabel: 'Wed, 16 Jul 2025',
    startTime: '22:00',
    endTime: '03:00',
    genre: 'Afrobeats / Club',
    artists: 'DJ Spinall, Ayra Starr (Live), Uncle Waffles',
    description: 'Mumbai, get ready! Neon Nights is back with an electrifying Afrobeats takeover.',
    ageLimit: record.summary?.information.ageLimit ?? '21+',
    dressCode: record.summary?.information.dressCode ?? 'Smart Casual',
    bookingLimit: '4 tickets',
    salesCloseTime: '1 hour before event',
    refundPolicy: 'No refunds',
    guestFeesPaise: 13_800,
    tickets: tickets.map((ticket, index) => ({
      id: ticket.name.toLowerCase().replaceAll(' ', '-'),
      name: ticket.name,
      pricePaise: ticket.pricePaise,
      capacity: ticket.capacity,
      benefits:
        index === 0
          ? 'Fast track entry · VIP area access · 2 drinks included'
          : index === 1
            ? 'Early access · Limited tickets · Best price'
            : 'Full access · Standard entry · Non-refundable',
      saleStart: '2025-05-20T10:00',
      saleEnd: '2025-07-16T21:00',
    })),
  };
};
