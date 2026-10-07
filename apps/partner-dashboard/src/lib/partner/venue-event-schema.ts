import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const timezoneOffsets = {
  'Asia/Kolkata': 330,
  'Asia/Dubai': 240,
  'Europe/London': 0,
  'America/New_York': -240,
} as const;

const localEventTimestamp = (
  date: string,
  time: string,
  timezone: keyof typeof timezoneOffsets,
): number => {
  const [year = 0, month = 0, day = 0] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) - timezoneOffsets[timezone] * 60_000;
};

export const venueTicketTierSchema = z.object({
  name: z.string().trim().min(2).max(60),
  pricePaise: z.number().int().min(0).max(10_000_000),
  inventory: z.number().int().min(1).max(20_000),
  saleStartsAt: z.iso.datetime(),
  saleEndsAt: z.iso.datetime(),
});

export const venueEventDraftSchema = z
  .object({
    name: z.string().trim().min(3).max(100),
    venueId: z.string().trim().min(1),
    eventDate: z.iso.date(),
    startTime: z.string().regex(timePattern),
    endTime: z.string().regex(timePattern),
    timezone: z.enum(['Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York']),
    capacity: z.number().int().min(1).max(20_000),
    ticketTiers: z.array(venueTicketTierSchema).min(1).max(20),
  })
  .superRefine((draft, context) => {
    const start = localEventTimestamp(draft.eventDate, draft.startTime, draft.timezone);
    const end = localEventTimestamp(draft.eventDate, draft.endTime, draft.timezone);
    if (end <= start)
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time must be after start time.',
      });
    if (start <= Date.now())
      context.addIssue({
        code: 'custom',
        path: ['eventDate'],
        message: 'Event must start in the future.',
      });
    const tierInventory = draft.ticketTiers.reduce((total, tier) => total + tier.inventory, 0);
    if (tierInventory > draft.capacity)
      context.addIssue({
        code: 'custom',
        path: ['ticketTiers'],
        message: 'Ticket inventory cannot exceed venue capacity.',
      });
    draft.ticketTiers.forEach((tier, index) => {
      const saleStart = Date.parse(tier.saleStartsAt);
      const saleEnd = Date.parse(tier.saleEndsAt);
      if (saleEnd <= saleStart)
        context.addIssue({
          code: 'custom',
          path: ['ticketTiers', index, 'saleEndsAt'],
          message: 'Ticket sale end must be after sale start.',
        });
      if (saleEnd > start)
        context.addIssue({
          code: 'custom',
          path: ['ticketTiers', index, 'saleEndsAt'],
          message: 'Ticket sales must close before the event starts.',
        });
    });
  });

export type VenueEventDraft = z.infer<typeof venueEventDraftSchema>;
