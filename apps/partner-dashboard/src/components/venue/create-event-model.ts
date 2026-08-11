import { venueEventDraftSchema } from '@/lib/partner/venue-event-schema';

import { venueEventSource } from './venue-events-model';
import { venueFinanceModel } from './venue-finance-model';

export interface CreateEventTicket {
  readonly id: string;
  readonly name: string;
  readonly pricePaise: number;
  readonly capacity: number;
}

export interface CreateEventDraft {
  readonly posterSrc: string;
  readonly name: string;
  readonly venueId: string;
  readonly venueName: string;
  readonly venueAddress: string;
  readonly venueCapacity: number;
  readonly date: string;
  readonly dateLabel: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly genre: string;
  readonly description: string;
  readonly ageLimit: string;
  readonly guestFeesPaise: number;
  readonly tickets: readonly CreateEventTicket[];
}

export interface TicketValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly totalCapacity: number;
}

export interface CreateEventReviewRow {
  readonly id: 'details' | 'venue' | 'tickets' | 'payout';
  readonly label: string;
  readonly summary: string;
  readonly step: 1 | 2;
}

const sourceEvent = venueEventSource.events.at(0);
if (!sourceEvent) throw new Error('Create Event requires one venue event source record.');

export const initialCreateEventDraft: CreateEventDraft = {
  posterSrc: sourceEvent.artworkSrc,
  name: 'Neon Nights: Afrobeats',
  venueId: 'skyline-rooftop',
  venueName: 'Skyline Rooftop',
  venueAddress: 'Bandra West, Mumbai',
  venueCapacity: 400,
  date: '2026-09-24',
  dateLabel: 'Thu, 24 Sep 2026',
  startTime: '22:00',
  endTime: '23:59',
  genre: 'Afrobeats / Club',
  description: 'Neon Nights returns with an Afrobeats takeover.',
  ageLimit: '21+',
  guestFeesPaise: 13_800,
  tickets: [
    { id: 'early-bird', name: 'Early Bird', pricePaise: 79_900, capacity: 150 },
    { id: 'general-entry', name: 'General Entry', pricePaise: 129_900, capacity: 100 },
    { id: 'couple-pass', name: 'Couple Pass', pricePaise: 199_900, capacity: 150 },
  ],
};

export const formatTicketPrice = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);

export const validateTicketTypes = (
  tickets: readonly CreateEventTicket[],
  capacity: number,
): TicketValidationResult => {
  const errors: string[] = [];
  const names = new Set<string>();
  for (const ticket of tickets) {
    const normalizedName = ticket.name.trim().toLocaleLowerCase('en-IN');
    if (!normalizedName) errors.push('Every ticket needs a name.');
    if (names.has(normalizedName)) errors.push('Ticket names must be unique.');
    names.add(normalizedName);
    if (ticket.pricePaise <= 0) errors.push(`${ticket.name || 'Ticket'} needs a positive price.`);
    if (ticket.capacity <= 0) errors.push(`${ticket.name || 'Ticket'} needs a positive capacity.`);
  }
  const totalCapacity = tickets.reduce((sum, ticket) => sum + Math.max(0, ticket.capacity), 0);
  if (totalCapacity > capacity)
    errors.push(`Ticket capacity cannot exceed venue capacity of ${String(capacity)}.`);
  return { valid: errors.length === 0, errors: [...new Set(errors)], totalCapacity };
};

export const validateEventDraft = (draft: CreateEventDraft): readonly string[] => {
  const ticketValidation = validateTicketTypes(draft.tickets, draft.venueCapacity);
  const parsed = venueEventDraftSchema.safeParse({
    name: draft.name,
    venueId: draft.venueId,
    eventDate: draft.date,
    startTime: draft.startTime,
    endTime: draft.endTime,
    timezone: 'Asia/Kolkata',
    capacity: draft.venueCapacity,
    ticketTiers: draft.tickets.map((ticket) => ({
      name: ticket.name,
      pricePaise: ticket.pricePaise,
      inventory: ticket.capacity,
      saleStartsAt: `${draft.date}T00:00:00.000Z`,
      saleEndsAt: `${draft.date}T14:00:00.000Z`,
    })),
  });
  const errors = [...ticketValidation.errors];
  if (!parsed.success) errors.push(parsed.error.issues[0]?.message ?? 'Review the event details.');
  if (!draft.description.trim()) errors.push('Add a short description.');
  return [...new Set(errors)];
};

export const createEventReviewRows = (draft: CreateEventDraft): readonly CreateEventReviewRow[] => {
  const lowestPrice = Math.min(...draft.tickets.map((ticket) => ticket.pricePaise));
  return [
    {
      id: 'details',
      label: 'Event details',
      summary: `${draft.name} · ${draft.dateLabel}`,
      step: 1,
    },
    {
      id: 'venue',
      label: 'Venue and time',
      summary: `${draft.venueName} · ${draft.startTime}`,
      step: 1,
    },
    {
      id: 'tickets',
      label: 'Tickets',
      summary: `${String(draft.tickets.length)} ticket types · From ${formatTicketPrice(lowestPrice)}`,
      step: 2,
    },
    {
      id: 'payout',
      label: 'Payout',
      summary: venueFinanceModel.bank
        ? `${venueFinanceModel.bank.name} ${venueFinanceModel.bank.maskedAccount}`
        : 'Unavailable',
      step: 2,
    },
  ];
};
