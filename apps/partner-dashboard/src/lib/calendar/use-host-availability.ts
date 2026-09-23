'use client';

import { useEffect, useMemo, useState } from 'react';

import { useSessionStore } from '@c1rcle/auth';

import { loadHostAvailability } from './host-availability-repository';
import { calendarMonthKeys, currentMonthKey } from './venue-calendar-repository';

import type { HostAvailabilityData } from '@/data/partner-data-source';

export interface HostAvailabilityState {
  readonly data: HostAvailabilityData | null;
  readonly error: string | null;
  readonly loading: boolean;
  readonly retry: () => void;
}

interface HostAvailabilityResult {
  readonly requestKey: string | null;
  readonly data: HostAvailabilityData | null;
  readonly error: string | null;
}

const IDLE_RESULT: HostAvailabilityResult = {
  requestKey: null,
  data: null,
  error: null,
};

export function useHostAvailability({
  organizationId,
  anchorMonth,
  monthsBefore = 0,
  monthsAfter = 12,
  enabled = true,
}: {
  readonly organizationId: string | null;
  readonly anchorMonth?: string;
  readonly monthsBefore?: number;
  readonly monthsAfter?: number;
  readonly enabled?: boolean;
}): HostAvailabilityState {
  const hydrated = useSessionStore().hydrated;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<HostAvailabilityResult>(IDLE_RESULT);
  const monthKeys = useMemo(
    () => calendarMonthKeys(anchorMonth ?? currentMonthKey(), monthsBefore, monthsAfter),
    [anchorMonth, monthsAfter, monthsBefore],
  );
  const requestKey = useMemo(
    () =>
      enabled && organizationId
        ? JSON.stringify({ attempt, monthKeys, organizationId })
        : null,
    [attempt, enabled, monthKeys, organizationId],
  );

  useEffect(() => {
    if (!requestKey || !organizationId || !hydrated) return;
    const controller = new AbortController();

    void loadHostAvailability({ organizationId, monthKeys, signal: controller.signal })
      .then((availability) => {
        if (!controller.signal.aborted) {
          setResult({ requestKey, data: availability, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            requestKey,
            data: null,
            error: cause instanceof Error ? cause.message : 'Availability could not be loaded.',
          });
        }
      });

    return () => {
      controller.abort();
    };
  }, [hydrated, monthKeys, organizationId, requestKey]);

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
