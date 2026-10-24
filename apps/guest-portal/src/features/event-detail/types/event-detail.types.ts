export type EventLifecycle = 'scheduled' | 'paused' | 'cancelled' | 'completed';
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
  availabilityLabel: string;
  availableQuantity?: number;
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
  hostId: string | null;
  host: string;
  venueId: string | null;
  summary: string;
  description: readonly string[];
  doorNote: string;
  lifecycle: EventLifecycle;
  guests: readonly EventDetailGuest[];
  interestedCount: number;
  ticketTiers: readonly EventDetailTicketTier[];
  /**
   * Ticket section header note. Authoritative events label their live
   * inventory explicitly.
   */
  ticketNote?: string;
}
