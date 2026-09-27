import { getScannerEnv } from '@/config/env';
import { getStoredItem, setStoredItem } from '@/storage/secureStorage';

/**
 * Which venue this handset acts for — the `X-Organization-Id` every call
 * carries (`docs/api-contracts/scanner-app.md` §1).
 *
 * The backend has no endpoint that resolves it: `POST /auth/login` returns
 * only the user, and there is no `/me` or memberships route, so the app
 * genuinely cannot derive it. It is also not a per-shift secret — a scanner
 * handset belongs to one venue for its whole deployed life — so it belongs
 * in device config, not in a form a door staffer retypes every night. That
 * also keeps the login screen to the two fields the reference design has.
 *
 * Resolution order: build config, then whatever the handset was bound to on
 * first run. Only when both are empty does login surface a field for it.
 */

const ORGANIZATION_ID_KEY = 'c1rcle_scanner_organization_id';

export async function getBoundOrganizationId(): Promise<string | null> {
  const fromConfig = getScannerEnv().organizationId;
  if (fromConfig !== null) {
    return fromConfig;
  }
  return getStoredItem(ORGANIZATION_ID_KEY);
}

export async function bindOrganizationId(organizationId: string): Promise<void> {
  await setStoredItem(ORGANIZATION_ID_KEY, organizationId);
}
