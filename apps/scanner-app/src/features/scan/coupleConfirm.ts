import { useCallback, useEffect, useRef, useState } from 'react';

import { confirmCheckIn } from '@/api/scannerApiClient';

import type { CheckInResult } from '@/api/schemas';

/**
 * Real couple-ticket confirm timing (`docs/scanner-app/02-scan-admission.md`
 * §2 D2) — deadline math against the SERVER's own `expiresAt`, not a
 * hardcoded 30s and not a naive `setTimeout` (which drifts if the app
 * backgrounds mid-countdown; recomputing from the deadline on every tick
 * self-corrects).
 */

interface PendingConfirmation {
  eventId: string;
  token: string;
  expiresAt: number;
  seats: number;
}

interface UseCoupleConfirmResult {
  pending: PendingConfirmation | null;
  secondsRemaining: number;
  expired: boolean;
  start: (input: { eventId: string; token: string; expiresAt: string; seats: number }) => void;
  confirm: (confirmed: boolean, operatorName?: string) => Promise<CheckInResult>;
  reset: () => void;
}

export function useCoupleConfirm(): UseCoupleConfirmResult {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (input: { eventId: string; token: string; expiresAt: string; seats: number }) => {
      const deadline = new Date(input.expiresAt).getTime();
      setPending({ eventId: input.eventId, token: input.token, expiresAt: deadline, seats: input.seats });
      clearTimer();
      intervalRef.current = setInterval(() => {
        setSecondsRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      }, 250);
      setSecondsRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    },
    [clearTimer],
  );

  const reset = useCallback(() => {
    clearTimer();
    setPending(null);
    setSecondsRemaining(0);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const confirm = useCallback(
    async (confirmed: boolean, operatorName?: string): Promise<CheckInResult> => {
      if (pending === null) {
        throw new Error('No pending couple-ticket confirmation to act on.');
      }
      const result = await confirmCheckIn({
        eventId: pending.eventId,
        confirmationToken: pending.token,
        confirmed,
        ...(operatorName !== undefined ? { operatorName } : {}),
      });
      reset();
      return result;
    },
    [pending, reset],
  );

  return {
    pending,
    secondsRemaining,
    expired: pending !== null && secondsRemaining <= 0,
    start,
    confirm,
    reset,
  };
}
