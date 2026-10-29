import type { EventAccentTone } from '@/features/event-detail/types/event-detail.types';
import type { OrderDto } from '@c1rcle/contracts';

export interface BookingMoney {
  amountPaise: number;
  currency: 'INR';
}

export interface BookingTicketTier {
  id: string;
  name: string;
  description: string;
  price: BookingMoney;
  coverAmountPaise?: number;
  maximumQuantity: number;
  guestCount?: number;
  admissionMode?: 'bundle' | 'per_person';
  audienceType?: 'GENERAL' | 'MALE' | 'FEMALE' | 'COUPLE' | 'GROUP' | 'STUDENT' | 'MEMBER';
  minAge?: number | null;
  maxAge?: number | null;
}

export interface BookingTicketAddon {
  id: string;
  name: string;
  description: string;
  kind: 'parking' | 'cloakroom' | 'merchandise';
  priceInPaise: number;
  availableQuantity: number;
  maxPerEntitlement: number;
}

export interface BookingEventFixture {
  id: string;
  eventId: string;
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
  ticketAddons?: readonly BookingTicketAddon[];
  /** False when a cancelled private event can only be rendered from order evidence. */
  detailsAvailable?: boolean;
  /**
   * True only for a published event whose real ticket tiers loaded, so a hold
   * and payment can reference them. Fixtures and the price-derived fallback tier
   * are previews and must not reach a payment provider.
   */
  purchasable?: boolean;
}

export interface BookingConfirmationFixture {
  id: string;
  bookingReference: string;
  status: OrderDto['status'];
  eventId: string;
  attendeeName: string;
  tierName: string;
  quantity: number;
  total: BookingMoney;
}
