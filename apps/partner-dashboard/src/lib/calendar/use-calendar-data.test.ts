import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useHostAvailability } from './use-host-availability';
import { useVenueCalendar } from './use-venue-calendar';

import type * as HostAvailabilityRepository from './host-availability-repository';
import type * as VenueCalendarRepository from './venue-calendar-repository';
import type { VenueCalendarWorkspace } from './venue-calendar-repository';
import type { HostAvailabilityData } from '@/data/partner-data-source';

const mocks = vi.hoisted(() => ({
  loadHostAvailability: vi.fn(),
  loadVenueCalendarWorkspace: vi.fn(),
}));

vi.mock('@c1rcle/auth', () => ({
  clearSession: vi.fn(),
  getAccessToken: () => null,
  refresh: vi.fn(),
  useSessionStore: () => ({ hydrated: true }),
}));

vi.mock('./host-availability-repository', async (importOriginal) => ({
  ...(await importOriginal<typeof HostAvailabilityRepository>()),
  loadHostAvailability: mocks.loadHostAvailability,
}));

vi.mock('./venue-calendar-repository', async (importOriginal) => ({
  ...(await importOriginal<typeof VenueCalendarRepository>()),
  loadVenueCalendarWorkspace: mocks.loadVenueCalendarWorkspace,
}));

const VENUE_WORKSPACE_ONE: VenueCalendarWorkspace = {
  venues: [],
  venue: null,
  calendar: null,
};

const VENUE_WORKSPACE_TWO: VenueCalendarWorkspace = {
  venues: [],
  venue: null,
  calendar: null,
};

const HOST_AVAILABILITY_ONE: HostAvailabilityData = {
  dataStatus: 'live',
  accent: 'lavender',
  venues: [],
};

const HOST_AVAILABILITY_TWO: HostAvailabilityData = {
  dataStatus: 'live',
  accent: 'lavender',
  venues: [],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

beforeEach(() => {
  mocks.loadHostAvailability.mockReset();
  mocks.loadVenueCalendarWorkspace.mockReset();
});

describe('calendar API loading state', () => {
  it('enters venue loading synchronously and hides stale data when the organization changes', async () => {
    mocks.loadVenueCalendarWorkspace.mockResolvedValueOnce(VENUE_WORKSPACE_ONE);
    const { result, rerender } = renderHook(
      ({ organizationId }) =>
        useVenueCalendar({ organizationId, anchorMonth: '2026-09', monthsAfter: 0 }),
      { initialProps: { organizationId: 'org-one' } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBe(VENUE_WORKSPACE_ONE);

    const nextRequest = deferred<VenueCalendarWorkspace>();
    mocks.loadVenueCalendarWorkspace.mockReturnValueOnce(nextRequest.promise);
    rerender({ organizationId: 'org-two' });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      nextRequest.resolve(VENUE_WORKSPACE_TWO);
      await nextRequest.promise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBe(VENUE_WORKSPACE_TWO);
  });

  it('clears a venue error as soon as retry starts', async () => {
    mocks.loadVenueCalendarWorkspace.mockRejectedValueOnce(new Error('Gateway unavailable'));
    const { result } = renderHook(() =>
      useVenueCalendar({ organizationId: 'org-one', anchorMonth: '2026-09', monthsAfter: 0 }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Gateway unavailable');
    });

    const retryRequest = deferred<VenueCalendarWorkspace>();
    mocks.loadVenueCalendarWorkspace.mockReturnValueOnce(retryRequest.promise);
    act(() => {
      result.current.retry();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      retryRequest.resolve(VENUE_WORKSPACE_ONE);
      await retryRequest.promise;
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('enters host loading synchronously and hides stale data when the organization changes', async () => {
    mocks.loadHostAvailability.mockResolvedValueOnce(HOST_AVAILABILITY_ONE);
    const { result, rerender } = renderHook(
      ({ organizationId }) =>
        useHostAvailability({ organizationId, anchorMonth: '2026-09', monthsAfter: 0 }),
      { initialProps: { organizationId: 'org-one' } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBe(HOST_AVAILABILITY_ONE);

    const nextRequest = deferred<HostAvailabilityData>();
    mocks.loadHostAvailability.mockReturnValueOnce(nextRequest.promise);
    rerender({ organizationId: 'org-two' });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await act(async () => {
      nextRequest.resolve(HOST_AVAILABILITY_TWO);
      await nextRequest.promise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBe(HOST_AVAILABILITY_TWO);
  });
});
