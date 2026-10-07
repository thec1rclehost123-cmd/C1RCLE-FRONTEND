import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerStudioFrame } from './PartnerStudioFrame';

const navigation = vi.hoisted(() => ({ pathname: '/partner/venue/finance' }));
const authAccess = vi.hoisted(() => ({ tabVisibility: null as Record<string, boolean> | null }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    profile: {
      displayName: 'Ravi Kumar',
      activeMembership: { partnerType: 'venue' },
    },
    user: { id: 'u1' },
    loading: false,
    isApproved: true,
    tabVisibility: authAccess.tabVisibility,
  }),
}));

beforeEach(() => {
  navigation.pathname = '/partner/venue/finance';
  authAccess.tabVisibility = null;
});

describe('PartnerStudioFrame role gating', () => {
  it('renders a no-access state instead of a withheld tab', async () => {
    authAccess.tabVisibility = { finance: false };
    const interactionData = await fixturePartnerDataSource.getPartnerShellInteractions('venue');

    render(
      <PartnerStudioFrame studio="venue" interactionData={interactionData}>
        <div>Finance content</div>
      </PartnerStudioFrame>,
    );

    expect(screen.getByText("Finance isn't available for your role")).toBeInTheDocument();
    expect(screen.queryByText('Finance content')).not.toBeInTheDocument();
  });

  it('renders allowed tabs normally', async () => {
    authAccess.tabVisibility = { finance: false };
    navigation.pathname = '/partner/venue/events';
    const interactionData = await fixturePartnerDataSource.getPartnerShellInteractions('venue');

    render(
      <PartnerStudioFrame studio="venue" interactionData={interactionData}>
        <div>Events content</div>
      </PartnerStudioFrame>,
    );

    expect(screen.getByText('Events content')).toBeInTheDocument();
  });

  it('fails open while access is still loading', async () => {
    const interactionData = await fixturePartnerDataSource.getPartnerShellInteractions('venue');

    render(
      <PartnerStudioFrame studio="venue" interactionData={interactionData}>
        <div>Finance content</div>
      </PartnerStudioFrame>,
    );

    expect(screen.getByText('Finance content')).toBeInTheDocument();
  });
});
