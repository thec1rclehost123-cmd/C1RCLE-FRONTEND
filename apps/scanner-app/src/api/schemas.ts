import { z } from 'zod';

import {
  coverWalletPresetItemSchema as contractCoverWalletPresetItemSchema,
  doorEventListResponseSchema,
  doorEventSummarySchema,
  doorGuestListResponseSchema,
  doorGuestSchema,
  doorSaleResponseSchema,
  doorSalesListResponseSchema,
  doorStatsDtoSchema,
  doorTicketSaleResponseSchema,
  manualCheckInResponseSchema as contractManualCheckInResponseSchema,
  organizationDtoSchema,
  overrideResponseSchema as contractOverrideResponseSchema,
  scanResponseSchema,
  scannerDeviceDtoSchema,
  startShiftResponseSchema,
  ticketLookupResponseSchema,
  walletChargeResponseSchema as contractWalletChargeResponseSchema,
  walletChargeViewSchema,
} from '@c1rcle/contracts';

/** Keep loginResponseSchema aligned to the scanner's minimal shape. */
export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string().nullable(),
    role: z.string(),
    avatarUrl: z.string().nullable(),
  }),
  accessToken: z.string(),
  expiresAt: z.number(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const organizationSchema = organizationDtoSchema;
export const organizationListResponseSchema = z.object({
  items: z.array(organizationSchema),
});
export type Organization = z.infer<typeof organizationSchema>;

export const doorEventSchema = doorEventSummarySchema;
export const doorEventsResponseSchema = doorEventListResponseSchema;
export type DoorEvent = z.infer<typeof doorEventSchema>;

export const scannerDeviceSchema = scannerDeviceDtoSchema.pick({
  deviceId: true,
  deviceName: true,
  status: true,
});
export type ScannerDevice = z.infer<typeof scannerDeviceSchema>;

export const sessionPermissionsSchema = startShiftResponseSchema.shape.permissions;
export type SessionPermissions = z.infer<typeof sessionPermissionsSchema>;

export const doorSessionResponseSchema = startShiftResponseSchema;
export type DoorSessionResponse = z.infer<typeof doorSessionResponseSchema>;

const entitlementSchemaOptional = scanResponseSchema.shape.entitlement;
const requiredEntitlement =
  entitlementSchemaOptional instanceof z.ZodOptional
    ? entitlementSchemaOptional.unwrap()
    : entitlementSchemaOptional;

export const checkInResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('consumed'),
    checkInId: z.string(),
    entitlement: requiredEntitlement,
  }),
  z.object({
    status: z.literal('denied'),
    checkInId: z.string(),
    denyReason: z.string(),
    denyMessage: z.string(),
  }),
  z.object({
    status: z.literal('confirmation_required'),
    confirmation: z.object({
      token: z.string(),
      expiresAt: z.string(),
      seats: z.number(),
    }),
    entitlement: requiredEntitlement,
  }),
]);
export type CheckInResult = z.infer<typeof checkInResultSchema>;

export const ticketLookupResultSchema = ticketLookupResponseSchema;
export type TicketLookupResult = z.infer<typeof ticketLookupResultSchema>;

export const doorStatsSchema = doorStatsDtoSchema;
export type DoorStats = z.infer<typeof doorStatsSchema>;

export const guestSchema = doorGuestSchema;
export const guestListResponseSchema = doorGuestListResponseSchema;
export type Guest = z.infer<typeof guestSchema>;

export const doorSaleSchema = doorSaleResponseSchema;
export const doorSalesResponseSchema = doorSalesListResponseSchema;
export type DoorSale = z.infer<typeof doorSaleSchema>;

export const paymentModeSchema = doorTicketSaleResponseSchema.shape.paymentMode;
export type PaymentMode = z.infer<typeof paymentModeSchema>;

export const walletPresetItemSchema = contractCoverWalletPresetItemSchema;
export type WalletPresetItem = z.infer<typeof walletPresetItemSchema>;

export const walletQrResponseSchema = walletChargeViewSchema;
export type WalletQrResponse = z.infer<typeof walletQrResponseSchema>;

export const walletChargeResponseSchema = contractWalletChargeResponseSchema;
export type WalletChargeResponse = z.infer<typeof walletChargeResponseSchema>;

export const ticketSaleResponseSchema = doorTicketSaleResponseSchema;
export type TicketSaleResponse = z.infer<typeof ticketSaleResponseSchema>;

export const manualCheckInResponseSchema = contractManualCheckInResponseSchema;
export type ManualCheckInResponse = z.infer<typeof manualCheckInResponseSchema>;

export const staffDenyResponseSchema = z.object({
  id: z.string(),
  status: z.literal('denied'),
  denyReason: z.string(),
  denyMessage: z.string().nullable(),
});
export type StaffDenyResponse = z.infer<typeof staffDenyResponseSchema>;

export const overrideResponseSchema = contractOverrideResponseSchema;
export type OverrideResponse = z.infer<typeof overrideResponseSchema>;
