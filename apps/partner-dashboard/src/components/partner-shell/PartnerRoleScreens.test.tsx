import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HostPartnersScreen } from '@/components/host/HostPartnersScreen';
import { PromoterPartnersScreen } from '@/components/promoter/PromoterPartnersScreen';

import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { readonly children: ReactNode; readonly href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CheckIcon: Icon,
    CloseIcon: Icon,
    LocationIcon: Icon,
    SearchIcon: Icon,
  };
});

const hostApiMocks = vi.hoisted(() => ({
  fetchHostVenuePartners: vi.fn(),
  fetchHostPromoterPartners: vi.fn(),
  fetchHostVenueRequests: vi.fn(),
  fetchHostPromoterRequests: vi.fn(),
}));

vi.mock('@/components/host/host-partners-api', () => ({
  fetchHostVenuePartners: hostApiMocks.fetchHostVenuePartners,
  fetchHostPromoterPartners: hostApiMocks.fetchHostPromoterPartners,
  fetchHostVenueRequests: hostApiMocks.fetchHostVenueRequests,
  fetchHostPromoterRequests: hostApiMocks.fetchHostPromoterRequests,
  getHostVenuePartners: vi.fn(() => []),
  getHostPromoterPartners: vi.fn(() => []),
  getHostVenueRequests: vi.fn(() => []),
  getHostPromoterRequests: vi.fn(() => []),
  clearCache: vi.fn(),
}));

const promoterApiMocks = vi.hoisted(() => ({
  fetchPromoterVenuePartners: vi.fn(),
  fetchPromoterHostPartners: vi.fn(),
  fetchPromoterVenueRequests: vi.fn(),
  fetchPromoterHostRequests: vi.fn(),
}));

vi.mock('@/components/promoter/promoter-partners-api', () => ({
  fetchPromoterVenuePartners: promoterApiMocks.fetchPromoterVenuePartners,
  fetchPromoterHostPartners: promoterApiMocks.fetchPromoterHostPartners,
  fetchPromoterVenueRequests: promoterApiMocks.fetchPromoterVenueRequests,
  fetchPromoterHostRequests: promoterApiMocks.fetchPromoterHostRequests,
  getPromoterVenuePartners: vi.fn(() => []),
  getPromoterHostPartners: vi.fn(() => []),
  getPromoterVenueRequests: vi.fn(() => []),
  getPromoterHostRequests: vi.fn(() => []),
  clearCache: vi.fn(),
}));

/** Backend-shaped rows: ID-derived labels with "—" for unknown fields, never dummy profiles. */
const backendPromoterPartner = {
  id: 'connection-active',
  kind: 'promoter',
  name: 'Promoter PROM01',
  city: '—',
  status: 'Active',
  verified: false,
  eventsTogether: 0,
  detail: 'Connected 2 Aug 2026',
} as const;

const backendSentVenueRequest = {
  id: 'partnership-pending-out',
  kind: 'venue',
  partnerName: 'Venue VENUE01',
  partnerCity: '—',
  eventName: '—',
  eventDate: '1 Aug 2026',
  status: 'Pending',
  updatedAt: '2 Aug 2026',
  direction: 'sent',
} as const;

const backendIncomingPromoterRequest = {
  id: 'connection-pending-in',
  kind: 'promoter',
  partnerName: 'Promoter PROM02',
  partnerCity: '—',
  eventName: '—',
  eventDate: '3 Aug 2026',
  status: 'Pending',
  updatedAt: '4 Aug 2026',
  direction: 'incoming',
} as const;

const backendHostPartner = {
  id: 'connection-host-active',
  kind: 'host',
  name: 'Host HOST01',
  city: '—',
  category: 'Host Organisation',
  verified: false,
  status: 'partnered',
  eventsTogether: 0,
  responseTime: '—',
  accent: 'violet',
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  hostApiMocks.fetchHostVenuePartners.mockResolvedValue([]);
  hostApiMocks.fetchHostPromoterPartners.mockResolvedValue([backendPromoterPartner]);
  hostApiMocks.fetchHostVenueRequests.mockResolvedValue([backendSentVenueRequest]);
  hostApiMocks.fetchHostPromoterRequests.mockResolvedValue([backendIncomingPromoterRequest]);
  promoterApiMocks.fetchPromoterVenuePartners.mockResolvedValue([]);
  promoterApiMocks.fetchPromoterHostPartners.mockResolvedValue([backendHostPartner]);
  promoterApiMocks.fetchPromoterVenueRequests.mockResolvedValue([]);
  promoterApiMocks.fetchPromoterHostRequests.mockResolvedValue([]);
});

describe('role partner screens (backend-only)', () => {
  it('renders host promoter partners from the backend and reviews requests', async () => {
    const user = userEvent.setup();
    render(<HostPartnersScreen initialTab="promoters" />);

    expect(await screen.findByRole('table', { name: 'Promoter partners' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Promoter' })).toBeInTheDocument();
    expect(screen.getByText('Promoter PROM01')).toBeInTheDocument();
    expect(screen.queryByText('Monsoon Sessions Invite')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Requests' }));
    expect(screen.getByRole('table', { name: 'Requests table' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sent 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Incoming 1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Incoming 1/ }));
    expect(screen.getByText('Promoter PROM02')).toBeInTheDocument();
  });

  it('renders promoter host partners from the backend and opens a role-labeled drawer', async () => {
    const user = userEvent.setup();
    render(<PromoterPartnersScreen initialTab="hosts" />);

    expect(await screen.findByRole('table', { name: 'Host partners' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Host' })).toBeInTheDocument();
    expect(screen.getByText('Host HOST01')).toBeInTheDocument();
    expect(screen.queryByText('Skyline Rooftop')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.getByRole('dialog', { name: 'Partner profile' })).toBeInTheDocument();
    expect(screen.getByText('Host · —')).toBeInTheDocument();
    expect(screen.getByText('Active partner')).toBeInTheDocument();

    await user.click(within(screen.getByRole('dialog', { name: 'Partner profile' })).getByRole('button', { name: 'Close partner details' }));
    expect(screen.queryByRole('dialog', { name: 'Partner profile' })).not.toBeInTheDocument();
  });
});
