'use client';

import { useEffect, useMemo, useState } from 'react';

import { useSessionStore } from '@c1rcle/auth';

import {
  calendarMonthKeys,
  currentMonthKey,
  loadVenueCalendarWorkspace,
  type VenueCalendarWorkspace,
} from './venue-calendar-repository';

export interface VenueCalendarState {
  readonly data: VenueCalendarWorkspace | null;
  readonly error: string | null;
  readonly loading: boolean;
  readonly retry: () => void;
}

interface VenueCalendarResult {
  readonly requestKey: string | null;
  readonly data: VenueCalendarWorkspace | null;
  readonly error: string | null;
}

const IDLE_RESULT: VenueCalendarResult = {
  requestKey: null,
  data: null,
  error: null,
};

export function useVenueCalendar({
  organizationId,
  anchorMonth,
  venueId,
  monthsBefore = 0,
  monthsAfter = 12,
  enabled = true,
}: {
  readonly organizationId: string | null;
  readonly anchorMonth?: string;
  readonly venueId?: string;
  readonly monthsBefore?: number;
  readonly monthsAfter?: number;
  readonly enabled?: boolean;
}): VenueCalendarState {
  const hydrated = useSessionStore().hydrated;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<VenueCalendarResult>(IDLE_RESULT);
  const monthKeys = useMemo(
    () => calendarMonthKeys(anchorMonth ?? currentMonthKey(), monthsBefore, monthsAfter),
    [anchorMonth, monthsAfter, monthsBefore],
  );
  const requestKey = useMemo(
    () =>
      enabled && organizationId
        ? JSON.stringify({ attempt, monthKeys, organizationId, venueId: venueId ?? null })
        : null,
    [attempt, enabled, monthKeys, organizationId, venueId],
  );

  useEffect(() => {
    if (!requestKey || !organizationId || !hydrated) return;
    const controller = new AbortController();

    void loadVenueCalendarWorkspace({
      organizationId,
      monthKeys,
      ...(venueId ? { venueId } : {}),
      signal: controller.signal,
    })
      .then((workspace) => {
        if (!controller.signal.aborted) {
          setResult({ requestKey, data: workspace, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            requestKey,
            data: null,
            error: cause instanceof Error ? cause.message : 'The calendar could not be loaded.',
          });
        }
      });

    return () => {
      controller.abort();
    };
  }, [hydrated, monthKeys, organizationId, requestKey, venueId]);

  // Effects run after rendering. Keying the result to its request keeps an old
  // organization's calendar out of that intervening render and makes loading
  // true immediately when the org, range, venue, or retry attempt changes.
  const currentResult = requestKey && result.requestKey === requestKey ? result : IDLE_RESULT;

  return {
    data: currentResult.data,
    error: currentResult.error,
    loading: Boolean(requestKey) && (!hydrated || result.requestKey !== requestKey),
    retry: () => {
      setAttempt((value) => value + 1);
    },
  };
}
