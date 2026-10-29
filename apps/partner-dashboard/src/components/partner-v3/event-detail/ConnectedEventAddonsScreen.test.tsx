import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectedEventAddonsScreen } from './ConnectedEventAddonsScreen';

const mocks = vi.hoisted(() => ({
  post: vi.fn<
    (input: {
      path: string;
      body: Record<string, unknown>;
      headers: Record<string, string>;
    }) => Promise<unknown>
  >(),
}));

vi.mock('@/lib/api/client', () => ({ apiClient: { post: mocks.post } }));

const createdAddon = {
  id: 'addon_parking',
  eventId: 'evt_1',
  organizationId: 'org_1',
  name: 'Parking pass',
  description: 'One vehicle',
  kind: 'parking' as const,
  currency: 'INR' as const,
  priceInPaise: 2500,
  quantity: 12,
  maxPerEntitlement: 1,
  salesStartAt: null,
  salesEndAt: null,
  status: 'active' as const,
  version: 1,
  createdAt: '2026-10-28T12:00:00.000Z',
  updatedAt: '2026-10-28T12:00:00.000Z',
};

describe('ConnectedEventAddonsScreen', () => {
  beforeEach(() => mocks.post.mockReset().mockResolvedValue(createdAddon));

  it('creates a server-priced catalog item and shows it in the list', async () => {
    render(
      <ConnectedEventAddonsScreen
        studio="host"
        eventId="evt_1"
        eventTitle="Sky Night"
        organizationId="org_1"
        initialAddons={[]}
      />,
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Parking pass' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'One vehicle' } });
    fireEvent.change(screen.getByLabelText('Price (₹)'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Stock units'), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create extra' }));

    await waitFor(() => {
      expect(mocks.post).toHaveBeenCalledTimes(1);
    });
    const request = mocks.post.mock.calls[0]?.[0];
    expect(request?.path).toBe('/api/v2/events/evt_1/ticket-addons');
    expect(request?.body).toMatchObject({
      name: 'Parking pass',
      priceInPaise: 2500,
      quantity: 12,
    });
    expect(request?.headers['x-organization-id']).toBe('org_1');
    expect(await screen.findByText('Parking pass')).toBeInTheDocument();
  });
});
