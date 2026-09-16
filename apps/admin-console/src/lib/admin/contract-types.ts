/**
 * The admin desk types. The `Admin*`/`*Status` type aliases (roles, actions,
 * proposal/onboarding/refund/payout status) are intentionally NOT part of the
 * generated `@c1rcle/contracts` export surface — only their value schemas are
 * re-exported. So we derive the types locally from the schema values that the
 * package does export, keeping a single source of truth on the backend.
 */
import { type z } from 'zod';

import {
  type adminActionSchema,
  type adminOrderDtoSchema,
  type adminPayoutStatusSchema,
  type adminPromoterAssignmentStatusSchema,
  type adminPromoDiscountTypeSchema,
  type adminPromoTypeSchema,
  type adminRefundRequestStatusSchema,
  type adminRoleSchema,
  type adminTicketStatusSchema,
  type adminVenueDtoSchema,
  type eventStatusSchema,
  type onboardingStatusSchema,
  type organizationStatusSchema,
  type proposalStatusSchema,
} from '@c1rcle/contracts';

export type AdminRole = z.infer<typeof adminRoleSchema>;
export type AdminAction = z.infer<typeof adminActionSchema>;
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;
export type AdminRefundRequestStatus = z.infer<typeof adminRefundRequestStatusSchema>;
export type AdminPayoutStatus = z.infer<typeof adminPayoutStatusSchema>;
export type EventStatus = z.infer<typeof eventStatusSchema>;
export type HostStatus = z.infer<typeof organizationStatusSchema>;
export type VenueStatus = z.infer<typeof adminVenueDtoSchema>['status'];
export type DisputeStatus = 'open' | 'under_review' | 'resolved';
export type DisputeResolutionOutcome = 'upheld' | 'denied';
export type OrderStatus = z.infer<typeof adminOrderDtoSchema>['status'];
export type TicketStatus = z.infer<typeof adminTicketStatusSchema>;
export type PromoType = z.infer<typeof adminPromoTypeSchema>;
export type PromoDiscountType = z.infer<typeof adminPromoDiscountTypeSchema>;
export type PromoterAssignmentStatus = z.infer<typeof adminPromoterAssignmentStatusSchema>;
