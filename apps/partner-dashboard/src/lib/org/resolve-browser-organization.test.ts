import { describe, expect, it, vi } from 'vitest';

import { resolveBrowserOrganizationId } from './resolve-browser-organization';

vi.mock('./org-repository', () => ({
  getOrganizations: () =>
    Promise.resolve([{ id: 'org_venue' }, { id: 'org_host' }, { id: 'org_other' }]),
  getPartnerAccess: (organizationId: string) => {
    if (organizationId === 'org_venue') return Promise.resolve({ partnerType: 'venue' });
    if (organizationId === 'org_host') return Promise.resolve({ partnerType: 'host' });
    return Promise.reject(new Error('forbidden'));
  },
}));

describe('resolveBrowserOrganizationId', () => {
  it('prefers the explicit cookie value without any reads', async () => {
    await expect(resolveBrowserOrganizationId('venue', 'org_cookie')).resolves.toBe('org_cookie');
  });

  it('derives the org from the session when the cookie is missing', async () => {
    await expect(resolveBrowserOrganizationId('venue', null)).resolves.toBe('org_venue');
    await expect(resolveBrowserOrganizationId('host', null)).resolves.toBe('org_host');
  });

  it('returns null when nothing grants the studio type', async () => {
    await expect(resolveBrowserOrganizationId('promoter', null)).resolves.toBeNull();
  });
});
