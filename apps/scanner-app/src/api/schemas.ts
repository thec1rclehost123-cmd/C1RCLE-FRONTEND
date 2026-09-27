import { z } from 'zod';

/**
 * Response shapes transcribed from `docs/api-contracts/scanner-app.md`
 * (C1RCLE-BACKEND). Kept minimal — only the fields this app's Phase 1
 * screens actually read, not the full contract surface.
 */

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

export const doorEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  venueId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  status: z.string(),
  capacity: z.number().nullable(),
});
export const doorEventsResponseSchema = z.object({ items: z.array(doorEventSchema) });
export type DoorEvent = z.infer<typeof doorEventSchema>;

export const scannerDeviceSchema = z.object({
  deviceId: z.string(),
  deviceName: z.string(),
  status: z.enum(['active', 'unbound']),
});
export type ScannerDevice = z.infer<typeof scannerDeviceSchema>;

export const sessionPermissionsSchema = z.object({
  canScan: z.boolean(),
  canDoorEntry: z.boolean(),
  canWalkIn: z.boolean(),
  canCharge: z.boolean(),
});
export type SessionPermissions = z.infer<typeof sessionPermissionsSchema>;

export const doorSessionResponseSchema = z.object({
  sessionId: z.string(),
  sessionToken: z.string(),
  sessionExpiresAt: z.string(),
  event: doorEventSchema,
  permissions: sessionPermissionsSchema,
  gate: z.string().nullable(),
  tiers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      entryType: z.string(),
      pricePaise: z.number(),
      available: z.number().nullable(),
    }),
  ),
  device: z.object({ deviceId: z.string(), deviceName: z.string() }),
});
export type DoorSessionResponse = z.infer<typeof doorSessionResponseSchema>;

const entitlementSchema = z.object({
  id: z.string(),
  tierId: z.string().nullable(),
  tierName: z.string().nullable(),
  holderName: z.string().nullable(),
  scansUsed: z.number(),
  scansAllowed: z.number(),
  status: z.string().nullable(),
});

export const checkInResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('consumed'),
    checkInId: z.string(),
    entitlement: entitlementSchema,
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
    entitlement: entitlementSchema,
  }),
]);
export type CheckInResult = z.infer<typeof checkInResultSchema>;

/**
 * `POST /door/lookup` — a non-mutating preview. Deliberately its own
 * `valid | invalid` vocabulary, not `checkInResultSchema`'s: nothing has
 * been consumed by this call, and reusing `consumed` here would read as
 * "this guest has been admitted" when they have not.
 */
export const ticketLookupResultSchema = z.object({
  status: z.enum(['valid', 'invalid']),
  denyReason: z.string().nullable(),
  denyMessage: z.string().nullable(),
  entitlement: entitlementSchema.optional(),
});
export type TicketLookupResult = z.infer<typeof ticketLookupResultSchema>;

export const doorStatsSchema = z.object({
  eventId: z.string(),
  occupancy: z.object({
    inside: z.number(),
    capacity: z.number().nullable(),
    remaining: z.number().nullable(),
    prebooked: z.number(),
  }),
});
export type DoorStats = z.infer<typeof doorStatsSchema>;

/**
 * `DoorGuest` exactly as `packages/contracts/src/contracts/phase5.ts`
 * defines it. This previously used `entitlementId`/`holderName`/`tierName`
 * and a generic `status: string` — none of which the server returns; the
 * real shape is `id`/`name`, a `ticketType`/`entryType` pair, and a
 * `status` enum of exactly `entered`/`not_entered`. Every guest-roster
 * fetch would have failed zod validation against real staging.
 */
export const guestSchema = z.object({
  id: z.string(),
  name: z.string(),
  ticketType: z.string(),
  entryType: z.string(),
  quantity: z.number(),
  source: z.enum(['online', 'door']),
  status: z.enum(['entered', 'not_entered']),
  enteredAt: z.string().nullable(),
  scansUsed: z.number().nullable(),
  scansAllowed: z.number().nullable(),
});
/**
 * `DoorSaleResponse` exactly as the contract defines it
 * (`docs/api-contracts/scanner-app.md` §9). This previously carried
 * `guestPhone`, `guestAge` and `gender`, which the server does not return —
 * the Door register rendered them and so showed "—" for every row forever.
 * Those are write-only inputs; the read model is headcount plus money.
 */
export const doorSaleSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  category: z.enum(['walkin', 'dinein']),
  guestName: z.string(),
  totalGuests: z.number(),
  amountPaise: z.number(),
  paymentMode: z.string(),
  status: z.string(),
  createdAt: z.string().nullable(),
});
export type DoorSale = z.infer<typeof doorSaleSchema>;
export const doorSalesResponseSchema = z.object({ items: z.array(doorSaleSchema) });

/** Payment modes the contract accepts on every money call. */
export const paymentModeSchema = z.enum(['cash', 'card', 'upi', 'other']);
export type PaymentMode = z.infer<typeof paymentModeSchema>;

// ---------------------------------------------------------------------------
// Phase 2 — money surfaces (docs/scanner-app/05-cover-wallet-door-sales.md)
// ---------------------------------------------------------------------------

export const walletPresetItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  amountPaise: z.number(),
  isAvailable: z.boolean(),
});
export type WalletPresetItem = z.infer<typeof walletPresetItemSchema>;

/** `POST /door/wallet-qr`. `balancePaise` is null when the venue hides
 * balances — the contract is explicit that this must render as *nothing*,
 * never as 0. Only a first name is returned, by design. */
export const walletQrResponseSchema = z.object({
  walletId: z.string(),
  eventId: z.string(),
  guestFirstName: z.string().nullable(),
  status: z.enum(['active', 'frozen', 'terminated', 'closed']),
  balancePaise: z.number().nullable(),
  presetItems: z.array(walletPresetItemSchema),
  minChargePaise: z.number(),
  maxChargePaise: z.number(),
});
export type WalletQrResponse = z.infer<typeof walletQrResponseSchema>;

export const walletChargeResponseSchema = z.object({
  charged: z.object({
    itemId: z.string(),
    label: z.string(),
    quantity: z.number(),
    amountPaise: z.number(),
  }),
  balancePaise: z.number().nullable(),
});
export type WalletChargeResponse = z.infer<typeof walletChargeResponseSchema>;

/** `POST /door/ticket-sale`. `replayed: true` means the retry reached the
 * original sale — the guest must NOT be charged again. */
export const ticketSaleResponseSchema = z.object({
  orderId: z.string(),
  amountPaise: z.number(),
  quantity: z.number(),
  paymentMode: z.string(),
  ticketIds: z.array(z.string()),
  checkInIds: z.array(z.string()),
  replayed: z.boolean(),
});
export type TicketSaleResponse = z.infer<typeof ticketSaleResponseSchema>;

/**
 * `DoorGuestListResponse` has no `cursor` — the roster is paged with a
 * server-side `limit` (max 1000) plus this `truncated` flag, not
 * cursor-based pagination. The previous shape required a `cursor` key that
 * the server never sends, so every fetch failed validation.
 */
export const guestListResponseSchema = z.object({
  items: z.array(guestSchema),
  truncated: z.boolean(),
});
export type Guest = z.infer<typeof guestSchema>;

/** `POST /door/guests/check-in` — a manual admission, NOT a scan outcome.
 * Distinct from `checkInResultSchema`: that union covers what the camera
 * path can return (consumed/denied/confirmation_required); this call
 * always succeeds or throws, and returns the guest row plus the ledger id. */
export const manualCheckInResponseSchema = z.object({
  guest: guestSchema,
  checkInId: z.string(),
});
export type ManualCheckInResponse = z.infer<typeof manualCheckInResponseSchema>;

/**
 * `POST /door/staff-deny` — recorded on the SAME `ScanLedgerStatus` machine
 * as a camera scan, via a different entry point (staff refusing someone who
 * never presented a scannable ticket).
 *
 * The real response is the FULL `CheckInDto` row (`id`, `denyMessage`,
 * `operatorName`, etc. — `apps/api-gateway/src/routes/v2/door/door-ops-routes.ts`
 * validates against `checkInDtoSchema`, not a minimal shape), confirmed
 * against a live gateway response, not assumed from the contract doc's
 * abbreviated prose. Only the fields this app actually reads are declared;
 * `.strip()`-by-default zod tolerates the rest.
 */
export const staffDenyResponseSchema = z.object({
  id: z.string(),
  status: z.literal('denied'),
  denyReason: z.string(),
  denyMessage: z.string().nullable(),
});
export type StaffDenyResponse = z.infer<typeof staffDenyResponseSchema>;

/** `POST /door/override` — admits a previously DENIED scan. `denyReason`/
 * `denyMessage` stay on the row (the contract is explicit these are never
 * cleared) — this is its own terminal state, not a rewrite. */
export const overrideResponseSchema = z.object({
  checkInId: z.string(),
  status: z.literal('overridden'),
  overriddenBy: z.string(),
  overrideReason: z.string(),
});
export type OverrideResponse = z.infer<typeof overrideResponseSchema>;
