import { partnerAccessDtoSchema } from '@c1rcle/contracts';

import { resolvePartnerV3Path } from '@/components/partner-shell/partner-role-routing';
import { apiClient } from '@/lib/api/client';
import { setActiveOrg } from '@/lib/org/active-org';
import { getOrganizations } from '@/lib/org/org-repository';

import type { OrganizationDto, PartnerAccessDto } from '@c1rcle/contracts';
import type { useRouter } from 'next/navigation';

export type WorkspaceType = PartnerAccessDto['partnerType'];

/**
 * `OrganizationDto.role` is the caller's *staff* role in that org (owner/admin/manager/member),
 * not the partner type (venue/host/promoter) — that only comes back from the per-org access
 * endpoint. Routing must resolve it from there, never from `org.role`.
 */
export async function resolveOrgOverviewPath(orgId: string): Promise<string> {
  try {
    const access = await apiClient.get({
      path: `/api/v2/organizations/${orgId}/access`,
      schema: partnerAccessDtoSchema,
      headers: { 'x-organization-id': orgId },
    });
    return resolvePartnerV3Path(access.partnerType, 'overview') ?? '/partner/select-organization';
  } catch {
    return '/partner/select-organization';
  }
}

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
        const access = await apiClient.get({
          path: `/api/v2/organizations/${org.id}/access`,
          schema: partnerAccessDtoSchema,
          headers: { 'x-organization-id': org.id },
        });
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
      router.push('/onboard');
    } else if (orgs.length === 1 && orgs[0]) {
      await setActiveOrg(orgs[0].id);
      router.push(await resolveOrgOverviewPath(orgs[0].id));
    } else {
      router.push('/partner/select-organization');
    }
  } catch {
    router.push('/partner/select-organization');
  }
}
