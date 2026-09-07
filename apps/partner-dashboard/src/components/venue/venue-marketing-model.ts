import { venueEventSource } from './venue-events-model';

export type MarketingChannel = 'WhatsApp' | 'SMS' | 'Email' | 'Push';
export type MarketingCampaignStatus = 'Sent' | 'Scheduled' | 'Draft';

export interface MarketingCampaign {
  readonly id: string;
  readonly name: string;
  readonly preview: string;
  readonly eventId: string;
  readonly eventName: string;
  readonly channel: MarketingChannel;
  readonly sentAt: string | null;
  /** Result supplied by the messaging provider. Null is never inferred. */
  readonly providerResult: string | null;
  readonly status: MarketingCampaignStatus;
}

export interface MarketingTemplate {
  readonly id: string;
  readonly channel: MarketingChannel;
  readonly title: string;
  readonly preview: string;
}

const selectedEvent = venueEventSource.events.at(0);
if (!selectedEvent) throw new Error('Marketing requires one venue event source record.');

export const venueMarketingSource = {
  event: {
    id: selectedEvent.id,
    name: selectedEvent.name,
    meta: `${selectedEvent.dayLabel}, ${selectedEvent.dateLabel} · ${selectedEvent.time} · ${selectedEvent.venue}`,
    artworkSrc: selectedEvent.artworkSrc,
    ticketsLeft: Math.max(0, selectedEvent.capacity - selectedEvent.ticketsSold),
  },
  audience: {
    label: 'Event guests',
    size: 2_140,
  },
  defaultChannel: 'SMS' as MarketingChannel,
  defaultMessage:
    'Neon Nights is tomorrow at Skyline Rooftop. Grab your tickets and see you on the dance floor.',
  previousResult: {
    eventName: 'Saturday Sessions',
    channel: 'SMS' as MarketingChannel,
    sentAt: '8 Jul 2025',
    providerResult: 'Delivered to 2,013 people',
  },
} as const;

export const venueCampaigns: readonly MarketingCampaign[] = [
  {
    id: 'campaign-reminder',
    name: 'Neon Nights Reminder',
    preview: 'Neon Nights is tomorrow…',
    eventId: selectedEvent.id,
    eventName: selectedEvent.name,
    channel: 'SMS',
    sentAt: '15 Jul 2025 · 6:00 PM',
    providerResult: 'Delivered to 2,013 people',
    status: 'Sent',
  },
  {
    id: 'campaign-tickets',
    name: 'Neon Nights Tickets',
    preview: 'Tickets are running low…',
    eventId: selectedEvent.id,
    eventName: selectedEvent.name,
    channel: 'WhatsApp',
    sentAt: '15 Jul 2025 · 5:30 PM',
    providerResult: '842 opened',
    status: 'Sent',
  },
  {
    id: 'campaign-update',
    name: 'Neon Nights Update',
    preview: 'Set times and entry information…',
    eventId: selectedEvent.id,
    eventName: selectedEvent.name,
    channel: 'Push',
    sentAt: '13 Jul 2025 · 7:00 PM',
    providerResult: null,
    status: 'Scheduled',
  },
  {
    id: 'campaign-announcement',
    name: 'Event Announcement',
    preview: 'Neon Nights is live…',
    eventId: selectedEvent.id,
    eventName: selectedEvent.name,
    channel: 'Email',
    sentAt: null,
    providerResult: null,
    status: 'Draft',
  },
];

export const venueMarketingTemplates: readonly MarketingTemplate[] = [
  {
    id: 'event-reminder',
    channel: 'WhatsApp',
    title: 'Event reminder',
    preview: 'Your event is coming up. Don’t miss out.',
  },
  {
    id: 'tickets-running-low',
    channel: 'SMS',
    title: 'Tickets running low',
    preview: 'Tickets are almost gone for your event.',
  },
  {
    id: 'doors-open',
    channel: 'Email',
    title: 'Doors open',
    preview: 'Doors are open. We can’t wait to see you.',
  },
  {
    id: 'lineup-announcement',
    channel: 'Email',
    title: 'Lineup announcement',
    preview: 'The full lineup for your event is here.',
  },
  {
    id: 'thank-you',
    channel: 'WhatsApp',
    title: 'Thank you',
    preview: 'Thank you for being part of the night.',
  },
  {
    id: 'event-update',
    channel: 'SMS',
    title: 'Event update',
    preview: 'A quick update with what guests need to know.',
  },
];

export const campaignResultLabel = (result: string | null): string =>
  result?.trim() ? result : 'Result unavailable';

export const getMarketingTemplate = (id: string | null): MarketingTemplate | null =>
  venueMarketingTemplates.find((template) => template.id === id) ?? null;
