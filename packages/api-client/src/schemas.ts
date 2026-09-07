/**
 * Shared response envelopes — re-exported from `@c1rcle/contracts`, the
 * backend-owned single source of truth (generated into
 * `packages/contracts/src` by `C1RCLE-BACKEND/scripts/export-contracts.mjs`,
 * behaviour-locked by `contract-parity.mjs`).
 *
 * Endpoint-specific schemas also live in `@c1rcle/contracts` — import them
 * from there directly, not through this module.
 */
export {
  pageInfoSchema,
  paginatedSchema,
  roleSchema,
  userSchema,
  sessionSchema,
  noContentSchema,
} from '@c1rcle/contracts/client';
