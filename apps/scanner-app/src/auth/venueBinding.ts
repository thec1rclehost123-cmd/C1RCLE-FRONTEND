import { getScannerEnv } from '@/config/env';
import { getStoredItem, setStoredItem } from '@/storage/secureStorage';

import type { Organization } from '@/api/schemas';

/**
 * Which venue this handset acts for — the `X-Organization-Id` every call
 * carries (`docs/api-contracts/scanner-app.md` §1).
 *
 * An earlier version of this file claimed the app "genuinely cannot derive it"
 * because login returns only the user and there is no `/me` route. That is no
 * longer true: `GET /api/v2/organizations` (routes/v2/partner/organizations.ts)
 * returns the caller's active memberships, so the org id is now DISCOVERED from
 * the backend after sign-in rather than typed by a door staffer.
 *
 * It is still not a per-shift secret — a scanner handset belongs to one venue
 * for its whole deployed life — so the resolved value is remembered on the
 * device and only re-resolved when it is not already known.
 *
 * Resolution order: build config (`EXPO_PUBLIC_ORGANIZATION_ID`, an operator
 * pinning a dedicated handset build to one venue) wins, then whatever this
 * handset was bound to on first run. Only when both are empty does login
 * discover it from the account, falling back to a manual field.
 */

const ORGANIZATION_ID_KEY = 'c1rcle_scanner_organization_id';

/**
 * Outcome of picking a venue from the account's memberships.
 *
 * `ambiguous` is deliberately distinct from `none`: one means "this account
 * genuinely has no venue, ask an owner for an invite", the other means "pick
 * one of these". Collapsing them (as returning a bare `null | string` did)
 * makes the login screen show a dead end for a perfectly healthy multi-venue
 * account.
 */
export type OrganizationChoice =
  | { readonly kind: 'resolved'; readonly organizationId: string }
  | { readonly kind: 'ambiguous'; readonly organizations: readonly Organization[] }
  | { readonly kind: 'none' };

/**
 * Pick the org this handset should act for.
 *
 * Exactly one membership is the overwhelmingly common case and is taken
 * without asking. More than one is ambiguous — a promoter who also owns a
 * venue — so it is handed back for the caller to present rather than guessed,
 * because guessing wrong points the scanner at another tenant's door.
 */
export function chooseOrganization(organizations: readonly Organization[]): OrganizationChoice {
  const first = organizations[0];
  if (organizations.length === 0) return { kind: 'none' };
  if (organizations.length === 1 && first !== undefined) {
    return { kind: 'resolved', organizationId: first.id };
  }
  return { kind: 'ambiguous', organizations };
}

export async function getBoundOrganizationId(): Promise<string | null> {
  const fromConfig = getScannerEnv().organizationId;
  if (fromConfig !== null) {
    return fromConfig;
  }
  return getStoredItem(ORGANIZATION_ID_KEY);
}

/**
 * The build-time pin only — never the on-device binding.
 *
 * Login needs to tell these two apart. An operator pin is a deliberate,
 * reviewable deployment decision, so an account that cannot access it is a
 * misconfiguration to report. A device binding is just leftover state that
 * goes stale when a different account signs in, so it should be quietly
 * replaced rather than obeyed.
 */
export function getConfiguredOrganizationId(): string | null {
  return getScannerEnv().organizationId;
}

export async function bindOrganizationId(organizationId: string): Promise<void> {
  await setStoredItem(ORGANIZATION_ID_KEY, organizationId);
}
