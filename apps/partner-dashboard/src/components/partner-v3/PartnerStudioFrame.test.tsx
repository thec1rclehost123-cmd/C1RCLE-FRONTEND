import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PartnerStudioFrame } from './PartnerStudioFrame';

const mocks = vi.hoisted(() => ({
  pathname: '/partner/venue/events/event_m3',
  replace: vi.fn(),
  auth: {
    loading: true,
    user: null,
    isApproved: false,
    profile: null,
    tabVisibility: null,
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => mocks.auth,
}));

vi.mock('./PartnerShell', () => ({
  PartnerShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="partner-shell">{children}</div>
  ),
}));

vi.mock('./States', () => ({
  LoadingState: ({ label }: { label: string }) => <div role="status">{label}</div>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('./PagePrimitives', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('PartnerStudioFrame server-authorized event routes', () => {
  beforeEach(() => {
    mocks.pathname = '/partner/venue/events/event_m3';
    mocks.replace.mockReset();
    mocks.auth = {
      loading: true,
      user: null,
      isApproved: false,
      profile: null,
      tabVisibility: null,
    };
  });

  it('renders server-authorized event content while client auth is still hydrating', () => {
    render(
      <PartnerStudioFrame studio="venue" interactionData={{} as never}>
        <div>Server-authorized event content</div>
      </PartnerStudioFrame>,
    );

    expect(screen.getByText('Server-authorized event content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('keeps non-server-authorized partner routes behind the client auth gate', () => {
    mocks.pathname = '/partner/venue/finance';

    render(
      <PartnerStudioFrame studio="venue" interactionData={{} as never}>
        <div>Protected finance content</div>
      </PartnerStudioFrame>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Authorizing Partner V3');
    expect(screen.queryByText('Protected finance content')).not.toBeInTheDocument();
  });
});
