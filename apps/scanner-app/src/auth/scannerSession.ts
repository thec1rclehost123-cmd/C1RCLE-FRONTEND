import { deleteStoredItem, getStoredItem, setStoredItem } from '@/storage/secureStorage';

import type { DoorEvent, SessionPermissions } from '@/api/schemas';

/**
 * Scanner session: the 12-hour, device+shift credential. The raw token is
 * returned exactly once by `POST /door/sessions`
 * (`docs/api-contracts/scanner-app.md` §5) — persisted immediately, read
 * back on every door-app call via the `X-Scanner-Session-Token` header.
 *
 * Stored in the `session` scope: Keychain/Keystore on a handset, and on the
 * web target a tab-scoped store, so a live door credential doesn't outlive
 * the browser session on a shared machine. See `@/storage/secureStorage`.
 */

const SESSION_TOKEN_KEY = 'c1rcle_scanner_session_token';
const SESSION_META_KEY = 'c1rcle_scanner_session_meta';

interface SessionMeta {
  sessionId: string;
  sessionExpiresAt: string;
  event: DoorEvent;
  permissions: SessionPermissions;
  gate: string | null;
  /** The shift's sellable tiers. Persisted because `POST /door/ticket-sale`
   * needs a `tierId`, and the contract says to check `tier.available` before
   * offering one — the shift payload is the only place they arrive. */
  tiers: SessionTier[];
}

export interface SessionTier {
  id: string;
  name: string;
  entryType: string;
  pricePaise: number;
  available: number | null;
}

export async function persistSession(input: {
  sessionToken: string;
  sessionId: string;
  sessionExpiresAt: string;
  event: DoorEvent;
  permissions: SessionPermissions;
  gate: string | null;
  tiers: SessionTier[];
}): Promise<void> {
  const meta: SessionMeta = {
    sessionId: input.sessionId,
    sessionExpiresAt: input.sessionExpiresAt,
    event: input.event,
    permissions: input.permissions,
    gate: input.gate,
    tiers: input.tiers,
  };
  await Promise.all([
    setStoredItem(SESSION_TOKEN_KEY, input.sessionToken, 'session'),
    setStoredItem(SESSION_META_KEY, JSON.stringify(meta), 'session'),
  ]);
}

export async function getSessionToken(): Promise<string | null> {
  return getStoredItem(SESSION_TOKEN_KEY, 'session');
}

export async function getSessionMeta(): Promise<SessionMeta | null> {
  const raw = await getStoredItem(SESSION_META_KEY, 'session');
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as SessionMeta;
  } catch {
    return null;
  }
}

export async function isSessionExpired(): Promise<boolean> {
  const meta = await getSessionMeta();
  if (meta === null) {
    return true;
  }
  return new Date(meta.sessionExpiresAt).getTime() <= Date.now();
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    deleteStoredItem(SESSION_TOKEN_KEY, 'session'),
    deleteStoredItem(SESSION_META_KEY, 'session'),
  ]);
}

export type { SessionMeta };
