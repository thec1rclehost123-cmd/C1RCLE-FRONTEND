'use client';

import { useEffect, useMemo, useState } from 'react';

import { useSessionStore } from '@c1rcle/auth';

import type { EventEditorPromoterOption } from '@/data/partner-data-source';

import { loadConnectedPromoterConnections } from './promoter-connection-repository';

export interface ConnectedPromotersState {
  readonly data: readonly EventEditorPromoterOption[];
  readonly error: string | null;
  readonly loading: boolean;
  readonly retry: () => void;
}

interface Result {
  readonly requestKey: string | null;
  readonly data: readonly EventEditorPromoterOption[];
  readonly error: string | null;
}

const IDLE_RESULT: Result = { requestKey: null, data: [], error: null };

function promoterOption(promoterId: string): EventEditorPromoterOption {
  const label = promoterId.length > 2 ? promoterId.slice(-8) : promoterId;
  return {
    id: promoterId,
    name: `Promoter ${label}`,
    initials: promoterId.slice(0, 2).toUpperCase(),
    role: 'Connected promoter',
  };
}

export function useConnectedPromoters(
  organizationId: string | null,
  enabled = true,
): ConnectedPromotersState {
  const hydrated = useSessionStore().hydrated;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>(IDLE_RESULT);
  const requestKey = useMemo(
    () => (enabled && organizationId ? JSON.stringify({ attempt, organizationId }) : null),
    [attempt, enabled, organizationId],
  );

  useEffect(() => {
    if (!requestKey || !organizationId || !hydrated) return;
    const controller = new AbortController();

    void loadConnectedPromoterConnections({ organizationId, signal: controller.signal })
      .then((connections) => {
        if (!controller.signal.aborted) {
          setResult({
            requestKey,
            data: connections.map((connection) => promoterOption(connection.promoterId)),
            error: null,
          });
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            requestKey,
            data: [],
            error: cause instanceof Error ? cause.message : 'Promoters could not be loaded.',
          });
        }
      });

    return () => controller.abort();
  }, [hydrated, organizationId, requestKey]);

  const currentResult = requestKey && result.requestKey === requestKey ? result : IDLE_RESULT;

  return {
    data: currentResult.data,
    error: currentResult.error,
    loading: Boolean(requestKey) && (!hydrated || result.requestKey !== requestKey),
    retry: () => setAttempt((value) => value + 1),
  };
}
