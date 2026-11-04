import { z } from 'zod';

const ticketTransferDtoSchema = z.object({
  id: z.string().min(3).max(128),
  entitlementId: z.string().min(3).max(128),
  eventId: z.string().min(3).max(128),
  status: z.enum(['pending', 'accepted', 'declined', 'cancelled', 'expired', 'frozen']),
  expiresAt: z.iso.datetime(),
  acceptedAt: z.iso.datetime().nullable(),
  resolvedAt: z.iso.datetime().nullable(),
  version: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type TicketTransferItem = z.infer<typeof ticketTransferDtoSchema>;

export const createTicketTransferResponseSchema = ticketTransferDtoSchema;

export const ticketTransferListResponseSchema = z.array(ticketTransferDtoSchema);

export const resendTicketTransferResponseSchema = z.object({ requested: z.literal(true) });

export const cancelTicketTransferResponseSchema = z.object({
  transfer: ticketTransferDtoSchema,
  entitlement: z.object({ id: z.string().min(3).max(128) }).optional(),
});

export const acceptTicketTransferResponseSchema = z.object({
  transfer: ticketTransferDtoSchema,
  entitlement: z.object({ id: z.string().min(3).max(128) }),
});

export const declineTicketTransferResponseSchema = z.object({
  transfer: ticketTransferDtoSchema,
});
