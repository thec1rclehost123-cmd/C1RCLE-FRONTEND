import { resolvePartnerV3Path } from '@/components/partner-shell/partner-role-routing';
import { isTabVisibleForAccess } from '@/lib/access/studio-tab-access';
import { staffApi } from '@/lib/api/staff-api';
import { setActiveOrg } from '@/lib/org/active-org';
import { getOrganizations, getPartnerAccess } from '@/lib/org/org-repository';
import { STUDIO_CONFIG } from '@/studios/studio-config';

import type { OrganizationDto, PartnerAccessDto } from '@c1rcle/contracts';
import type { useRouter } from 'next/navigation';

export type WorkspaceType = PartnerAccessDto['partnerType'];

/**
 * `OrganizationDto.role` is the caller's *staff* role in that org (owner/admin/manager/member),
 * not the partner type (venue/host/promoter) — that only comes back from the per-org access
 * endpoint. Routing must resolve it from there, never from `org.role`.
 */

/**
 * Resolves every org's `partnerType` (via the same per-org `/access` endpoint
 * `resolveOrgOverviewPath` uses) and keeps only the ones matching `partnerType` —
 * for a login-time workspace picker to validate its selection against. An org the
 * caller can't reach (403, e.g. suspended) is dropped rather than surfaced as an
 * error, same as a non-match.
 */
export async function filterOrgsByPartnerType(
  orgs: OrganizationDto[],
  partnerType: WorkspaceType,
): Promise<OrganizationDto[]> {
  const results = await Promise.all(
    orgs.map(async (org) => {
      try {
        const access = await getPartnerAccess(org.id);
        return access.partnerType === partnerType ? org : null;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((org): org is OrganizationDto => org !== null);
}

/**
 * Where a signed-in user with at least one organization lands: zero orgs → `/onboard`, one org →
 * set it active and go straight to its studio, several → the picker. Shared by `/login` and the
 * onboard flow's post-approval hop so the two never drift apart.
 */
export async function routeAfterAuth(router: ReturnType<typeof useRouter>): Promise<void> {
  try {
    const orgs = await getOrganizations();
    if (orgs.length === 0) {
      if (await redirectToFirstPendingInvite(router)) return;
      router.push('/onboard');
    } else if (orgs.length === 1 && orgs[0]) {
      setActiveOrg(orgs[0].id);
      router.push(await resolveLandingPath(orgs[0].id));
    } else {
      router.push('/partner/select-organization');
    }
  } catch {
    router.push('/partner/select-organization');
  }
}

/**
 * The studio landing for an org: its first navigation tab the backend's
 * per-role matrix does not withhold — so restricted roles (e.g. venue staff,
 * whose matrix withholds overview) land on something they can actually use
 * instead of a denial screen. Owners hit `overview`, exactly as before.
 * Falls back to the picker when the access read fails.
 */
export async function resolveLandingPath(orgId: string): Promise<string> {
  try {
    const access = await getPartnerAccess(orgId);
    const studio =
      access.partnerType === 'host'
        ? 'host'
        : access.partnerType === 'promoter'
          ? 'promoter'
          : 'venue';
    const first = STUDIO_CONFIG[studio].navigation.find((item) =>
      isTabVisibleForAccess(item.href, access.tabVisibility),
    );
    return (
      first?.href ??
      resolvePartnerV3Path(access.partnerType, 'overview') ??
      '/partner/select-organization'
    );
  } catch {
    return '/partner/select-organization';
  }
}

export const resolveOrgOverviewPath = resolveLandingPath;

/**
 * Sends a zero-org login to its first pending invitation's accept page.
 * Returns true when it redirected. This is what keeps a freshly-invited
 * login (valid credentials, no membership yet) out of `/onboard`: onboarding
 * is for applicants, not invitees. Any failure falls through to the caller
 * (which keeps its previous destination) — a broken lookup must never trap
 * the user on a blank screen.
 */
export async function redirectToFirstPendingInvite(
  router: Pick<ReturnType<typeof useRouter>, 'push' | 'replace'>,
): Promise<boolean> {
  try {
    const { items } = await staffApi.listMyInvitations();
    const first = items.find((invite) => invite.status === 'pending');
    if (!first) return false;
    router.push(`/invitations/${first.id}/accept`);
    return true;
  } catch {
    return false;
  }
}
