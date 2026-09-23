import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StudioPartnersClient } from './StudioPartnersClient';

const mocks = vi.hoisted(() => ({
  getVenuePartnersFromApi: vi.fn(),
  getHostPartnersFromApi: vi.fn(),
  getPromoterPartnersFromApi: vi.fn(),
}));

vi.mock('@/data/api-partner-data-source', () => ({
  getVenuePartnersFromApi: mocks.getVenuePartnersFromApi,
  getHostPartnersFromApi: mocks.getHostPartnersFromApi,
  getPromoterPartnersFromApi: mocks.getPromoterPartnersFromApi,
}));

const backendVenueData = {
  dataStatus: 'fixture',
  hosts: {
    connected: [
      {
        id: 'partnership-active',
        name: 'Host BACKEND01',
        initials: 'HB',
        kind: 'host',
        role: 'Host Organisation',
        location: '—',
        genres: [],
        stats: [],
        upcomingEvents: [],
        verified: false,
        cardTone: 'violet',
        status: 'Partnered',
      },
    ],
    discover: [],
    requests: { incoming: [], outgoing: [] },
  },
  promoters: {
    connected: [],
    discover: [],
    requests: { incoming: [], outgoing: [] },
  },
  staff: [],
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getVenuePartnersFromApi.mockResolvedValue(backendVenueData);
});

describe('StudioPartnersClient (backend-only)', () => {
  it('does not show a loading placeholder before backend data resolves', () => {
    render(
      <StudioPartnersClient
        studio="venue"
        segment="hosts"
        subView="connected"
        search=""
        promoterTab="discover"
        promoterFilter="all"
      />,
    );
    expect(screen.queryByText('Loading partners…')).not.toBeInTheDocument();
  });

  it('renders backend partners without fixture profiles', async () => {
    render(
      <StudioPartnersClient
        studio="venue"
        segment="hosts"
        subView="connected"
        search=""
        promoterTab="discover"
        promoterFilter="all"
      />,
    );

    expect(await screen.findByText('Host BACKEND01')).toBeInTheDocument();
    // Fixture/dummy profiles must never appear on the partners tab.
    expect(screen.queryByText('Kabir M. (Sunday Sessions)')).not.toBeInTheDocument();
    expect(screen.queryByText('Pulse Collective')).not.toBeInTheDocument();
    expect(screen.queryByText('Zoya (Nightowl)')).not.toBeInTheDocument();
  });

  it('shows an error state with retry instead of fixture fallback when the backend fails', async () => {
    mocks.getVenuePartnersFromApi.mockRejectedValue(new Error('backend down'));
    render(
      <StudioPartnersClient
        studio="venue"
        segment="hosts"
        subView="connected"
        search=""
        promoterTab="discover"
        promoterFilter="all"
      />,
    );

    expect(await screen.findByText("Couldn't load partners")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('Kabir M. (Sunday Sessions)')).not.toBeInTheDocument();
  });

  it('asks for an organization instead of showing dummy data when none is selected', async () => {
    mocks.getVenuePartnersFromApi.mockRejectedValue(new Error('No active organization selected'));
    render(
      <StudioPartnersClient
        studio="venue"
        segment="hosts"
        subView="connected"
        search=""
        promoterTab="discover"
        promoterFilter="all"
      />,
    );

    expect(await screen.findByText('No organization selected')).toBeInTheDocument();
    expect(screen.queryByText('Kabir M. (Sunday Sessions)')).not.toBeInTheDocument();
  });
});
