import { beforeEach, describe, expect, it, vi } from 'vitest';

import { venueSlotDtoSchema } from '@c1rcle/contracts';

import { unblockVenueDate } from './venue-calendar-repository';

const mocks = vi.hoisted(() => ({ delete: vi.fn() }));

vi.mock('@/lib/api/client', () => ({ apiClient: { delete: mocks.delete } }));

describe('venue calendar mutations', () => {
  beforeEach(() => vi.resetAllMocks());

  it('sends unblock through the tenant-scoped API with a stable caller idempotency key', async () => {
    const tombstone = {
      id: 'block/m3',
      venueId: 'venue/m3',
      label: 'M3 test block',
      startTime: '2026-11-30T19:00:00.000Z',
      endTime: '2026-11-30T23:00:00.000Z',
      recurring: false,
      capacityFor: null,
      status: 'cancelled',
      version: 2,
      createdAt: '2026-10-22T00:00:00.000Z',
      updatedAt: '2026-10-23T00:00:00.000Z',
    };
    mocks.delete.mockResolvedValue(tombstone);

    await expect(
      unblockVenueDate({
        organizationId: 'm3-e2e-org',
        venueId: 'venue/m3',
        blockId: 'block/m3',
        idempotencyKey: 'm3-unblock-idem-1',
      }),
    ).resolves.toEqual(tombstone);

    expect(mocks.delete).toHaveBeenCalledWith({
      path: '/api/v2/venues/venue%2Fm3/calendar/blocks/block%2Fm3',
      headers: {
        'x-organization-id': 'm3-e2e-org',
        'Idempotency-Key': 'm3-unblock-idem-1',
      },
      schema: venueSlotDtoSchema,
    });
  });
});
