import { getActiveOrgId } from './active-org-cookie';
import { getOrganizations, getPartnerAccess } from './org-repository';

/**
 * Which organization a browser screen reads as. The active-org cookie wins
 * when present (explicit user choice); otherwise the org is derived from the
 * session — login is venue/host/promoter directly, there is no selection
 * step, so the first org whose server-computed partner type matches wins.
 * Returns `null` when signed out, org-less, or unreachable, letting the caller
 * render its honest empty/error state. Never throws.
 */
export async function resolveBrowserOrganizationId(
  partnerType: 'venue' | 'host' | 'promoter',
  direct: string | null = getActiveOrgId(),
): Promise<string | null> {
  if (direct) return direct;
  try {
    const orgs = await getOrganizations();
    const matches: string[] = [];
    await Promise.all(
      orgs.map(async (org) => {
        try {
          const access = await getPartnerAccess(org.id);
          if (access.partnerType === partnerType) matches.push(org.id);
        } catch {
          // Dropped, same rule as the login-time workspace picker.
        }
      }),
    );
    return [...matches].sort()[0] ?? null;
  } catch {
    return null;
  }
}
