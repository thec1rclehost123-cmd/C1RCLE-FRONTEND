import { waitFor } from '@testing-library/react';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardAuthProvider, useDashboardAuth } from './DashboardAuthProvider';

import type { SessionState } from '@c1rcle/auth';

const mocks = vi.hoisted(() => ({
  getActiveOrgId: vi.fn<() => string | null>(),
  useSession: vi.fn<() => { isAuthenticated: boolean; isLoading: boolean; user: any }>(),
  orgAccess: {
    partnerType: 'venue',
    role: 'owner',
    permissions: [],
    tabVisibility: null,
    isLoading: false,
    error: null,
    isSuspended: false,
    hasPermission: () => true,
    tabVisible: () => true,
  },
}));

vi.mock('@c1rcle/auth', () => ({
  useSession: () => mocks.useSession(),
  useSessionStore: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  getAccessToken: () => 'tok_abc',
}));

vi.mock('@/lib/org/active-org', () => ({
  getActiveOrgId: () => mocks.getActiveOrgId(),
  setActiveOrg: vi.fn(),
}));

vi.mock('@/lib/access/use-org-access', () => ({
  useOrgAccess: () => mocks.orgAccess,
}));

vi.mock('@/lib/org/org-repository', () => ({
  getOrganizations: () =>
    Promise.resolve([
      {
        id: 'org_1',
        name: 'Org 1',
        slug: 'org-1',
        role: 'owner',
        status: 'active',
        version: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]),
  getPartnerAccess: () =>
    Promise.resolve({
      organizationId: 'org_1',
      userId: 'usr_1',
      partnerType: 'venue',
      role: 'owner',
      permissions: [],
      tabVisibility: null,
    }),
}));

vi.mock('@/lib/onboarding/onboarding-repository', () => ({
  getMyOnboardingRequest: () => Promise.resolve(null),
}));

function ProfileName() {
  const auth = useDashboardAuth();
  return <span>{auth.profile?.displayName ?? 'Partner'}</span>;
}

beforeEach(() => {
  mocks.getActiveOrgId.mockReset().mockReturnValue('org_1');
  mocks.useSession.mockReset().mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: 'usr_1',
      email: 'agarwal@example.com',
      displayName: 'agarwal keshvii',
      role: 'partner',
      avatarUrl: null,
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DashboardAuthProvider hydration', () => {
  it('keeps browser-only auth state out of SSR and renders profile upon client hydration', async () => {
    const tree = (
      <DashboardAuthProvider>
        <ProfileName />
      </DashboardAuthProvider>
    );
    const serverHtml = renderToString(tree);

    expect(serverHtml).toContain('Authorizing Access');

    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.append(container);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const root = hydrateRoot(container, tree);

    await waitFor(() => expect(container).toHaveTextContent('agarwal keshvii'));
    const errors = consoleError.mock.calls.flat().join(' ');
    expect(errors).not.toContain('Hydration failed');
    expect(errors).not.toContain("didn't match");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
