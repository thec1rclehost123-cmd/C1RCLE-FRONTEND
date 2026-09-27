import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseVenueShareDraft, VenueSharePanel } from './VenueSharePanel';

import type { PartnershipDto } from '@c1rcle/contracts';
import type { Mock } from 'vitest';

const listPartnershipsMock = vi.hoisted(() => vi.fn());
const setVenueShareMock = vi.hoisted(() => vi.fn());
const getActiveOrgIdMock = vi.hoisted((): Mock<() => string | null> => vi.fn(() => 'org_venue'));

vi.mock('@/lib/partner/api-partnerships-repository', () => ({
  listPartnerships: listPartnershipsMock,
  setVenueShare: setVenueShareMock,
}));

vi.mock('@/lib/org/active-org', () => ({
  getActiveOrgId: getActiveOrgIdMock,
}));

const base: PartnershipDto = {
  id: 'part_1',
  hostOrganizationId: 'org_host_abcdefgh',
  venueOrganizationId: 'org_venue',
  venueId: 'venue_1',
  initiatedBy: 'host',
  status: 'active',
  message: null,
  venueShareRate: 20,
  resolutionReason: null,
  resolvedAt: null,
  version: 2,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-02T10:00:00.000Z',
};

afterEach(() => {
  listPartnershipsMock.mockReset();
  setVenueShareMock.mockReset();
  getActiveOrgIdMock.mockReset();
  getActiveOrgIdMock.mockReturnValue('org_venue');
});

describe('parseVenueShareDraft', () => {
  it('treats a blank draft as an explicit clear', () => {
    expect(parseVenueShareDraft('')).toBeNull();
    expect(parseVenueShareDraft('   ')).toBeNull();
  });

  it('accepts the whole-number percent bounds the domain allows', () => {
    expect(parseVenueShareDraft('0')).toBe(0);
    expect(parseVenueShareDraft('20')).toBe(20);
    expect(parseVenueShareDraft('50')).toBe(50);
  });

  it('rejects a fractional rate rather than rounding it', () => {
    expect(parseVenueShareDraft('20.5')).toEqual({ error: expect.any(String) });
  });

  it('rejects a rate above the domain cap', () => {
    expect(parseVenueShareDraft('51')).toEqual({
      error: 'The venue share cannot exceed 50%.',
    });
  });

  it('rejects a negative rate and non-numeric input', () => {
    expect(parseVenueShareDraft('-1')).toEqual({ error: expect.any(String) });
    expect(parseVenueShareDraft('abc')).toEqual({ error: expect.any(String) });
  });
});

describe('VenueSharePanel', () => {
  it('shows a pick-a-tenant message and issues no request when there is no active org', async () => {
    getActiveOrgIdMock.mockReturnValue(null);

    render(<VenueSharePanel />);

    expect(
      await screen.findByText(/Select an organization to manage its venue share/i),
    ).toBeInTheDocument();
    expect(listPartnershipsMock).not.toHaveBeenCalled();
  });

  it('surfaces a load failure instead of rendering an empty table', async () => {
    listPartnershipsMock.mockRejectedValue(new Error('boom'));

    render(<VenueSharePanel />);

    expect(await screen.findByText(/Could not load partnerships/i)).toBeInTheDocument();
  });

  it('renders the current rate for an active partnership and saves a new one', async () => {
    const user = userEvent.setup();
    listPartnershipsMock.mockResolvedValue([base]);
    setVenueShareMock.mockResolvedValue({ ...base, venueShareRate: 30, version: 3 });

    render(<VenueSharePanel />);

    const input = await screen.findByRole('spinbutton', { name: /Venue share percent/i });
    await waitFor(() => expect(input).toHaveValue(20));
    expect(input).toBeEnabled();

    await user.clear(input);
    await user.type(input, '30');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(setVenueShareMock).toHaveBeenCalledWith('org_venue', 'part_1', 30, expect.any(String)),
    );
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('disables the control on a partnership that is not active, because the domain refuses it', async () => {
    listPartnershipsMock.mockResolvedValue([{ ...base, status: 'pending', venueShareRate: null }]);

    render(<VenueSharePanel />);

    const input = await screen.findByRole('spinbutton', { name: /Venue share percent/i });
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByText(/Available once this partnership is active/i)).toBeInTheDocument();
  });

  it('refuses to send an out-of-range rate', async () => {
    const user = userEvent.setup();
    listPartnershipsMock.mockResolvedValue([base]);

    render(<VenueSharePanel />);

    const input = await screen.findByRole('spinbutton', { name: /Venue share percent/i });
    await user.clear(input);
    await user.type(input, '80');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/cannot exceed 50%/i)).toBeInTheDocument();
    expect(setVenueShareMock).not.toHaveBeenCalled();
  });

  it('keeps the input unchanged and reports failure when the save fails', async () => {
    const user = userEvent.setup();
    listPartnershipsMock.mockResolvedValue([base]);
    setVenueShareMock.mockRejectedValue(new Error('network'));

    render(<VenueSharePanel />);

    const input = await screen.findByRole('spinbutton', { name: /Venue share percent/i });
    await user.clear(input);
    await user.type(input, '35');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/Could not save the venue share/i)).toBeInTheDocument();
    expect(input).toHaveValue(35);
  });

  it('explains the empty state when the org has no partnerships', async () => {
    listPartnershipsMock.mockResolvedValue([]);

    render(<VenueSharePanel />);

    expect(await screen.findByText(/No partnerships yet/i)).toBeInTheDocument();
  });
});
