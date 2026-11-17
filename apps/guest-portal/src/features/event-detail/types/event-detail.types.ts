import type { EventMediaDto } from '@c1rcle/contracts';

export type EventLifecycle =
  'scheduled' | 'paused' | 'cancelled' | 'postponed' | 'completed' | 'sold_out';
export type EventSalesStatus =
  | 'on_sale'
  | 'sold_out'
  | 'sales_paused'
  | 'ended'
  | 'cancelled'
  | 'postponed'
  | 'not_yet_available'
  | 'temporarily_held';
export type EventAccentTone = 'pink' | 'purple' | 'red' | 'orange';
export type EventGuestTone = 'yellow' | 'red' | 'purple';

export interface EventDetailMoney {
  amountPaise: number;
  currency: 'INR';
}

export interface EventDetailTicketTier {
  id: string;
  name: string;
  description: string;
  price: EventDetailMoney | null;
  basePrice?: EventDetailMoney | null;
  pricingPhase?: {
    name: string;
    startsAt: string;
    endsAt: string;
    availableQuantity: number | null;
  } | null;
  availabilityStatus?:
    | 'available'
    | 'sold_out'
    | 'temporarily_held'
    | 'not_yet_available'
    | 'sales_ended'
    | 'sales_paused'
    | 'pricing_unavailable';
  availabilityLabel: string;
  availableQuantity?: number;
  audienceType?: 'GENERAL' | 'MALE' | 'FEMALE' | 'COUPLE' | 'GROUP' | 'STUDENT' | 'MEMBER';
  minAge?: number | null;
  maxAge?: number | null;
  guestCount?: number;
  admissionMode?: 'bundle' | 'per_person';
}

export interface EventDetailGuest {
  id: string;
  name: string;
  initials: string;
  tone: EventGuestTone;
}

export interface EventDetailFixture {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string;
  accentTone: EventAccentTone;
  startsAt: string;
  endsAt: string;
  venue: string;
  address: string;
  city: string;
  mapUrl?: string;
  hostId: string | null;
  host: string;
  venueId: string | null;
  summary: string;
  description: readonly string[];
  media?: EventMediaDto;
  doorNote: string;
  lifecycle: EventLifecycle;
  salesStatus?: EventSalesStatus;
  guests: readonly EventDetailGuest[];
  interestedCount: number;
  ticketTiers: readonly EventDetailTicketTier[];
  /**
   * Ticket section header note. Authoritative events label their live
   * inventory explicitly.
   */
  ticketNote?: string;
}
