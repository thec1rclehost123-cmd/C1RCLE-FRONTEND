import type { EventAccentTone } from '@/features/event-detail/types/event-detail.types';

export interface BookingMoney {
  amountPaise: number;
  currency: 'INR';
}

export interface BookingTicketTier {
  id: string;
  name: string;
  description: string;
  price: BookingMoney;
  maximumQuantity: number;
}

export interface BookingEventFixture {
  id: string;
  title: string;
  category: string;
  image: string;
  accentTone: EventAccentTone;
  startsAt: string;
  venue: string;
  address: string;
  city: string;
  doorNote: string;
  ticketTiers: readonly BookingTicketTier[];
}

export interface BookingConfirmationFixture {
  id: string;
  eventId: string;
  attendeeName: string;
  tierName: string;
  quantity: number;
  total: BookingMoney;
  referenceLabel: string;
}
