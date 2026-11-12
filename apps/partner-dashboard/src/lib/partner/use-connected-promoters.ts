'use client';

import { useEffect, useMemo, useState } from 'react';

import { useSessionStore } from '@c1rcle/auth';

import {
  loadAssignablePromoterCandidates,
  loadConnectedPromoterConnections,
} from './promoter-connection-repository';

import type { EventEditorPromoterOption } from '@/data/partner-data-source';

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

function promoterOption(id: string, name: string, role: string): EventEditorPromoterOption {
  return {
    id,
    name,
    initials: name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
    role,
  };
}

function usePromoterOptions(
  organizationId: string | null,
  enabled: boolean,
  eligibility: 'connected' | 'assignable',
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

    const load =
      eligibility === 'assignable'
        ? loadAssignablePromoterCandidates({ organizationId, signal: controller.signal }).then(
            (rows) => rows.map((row) => promoterOption(row.id, row.name, 'Eligible promoter')),
          )
        : loadConnectedPromoterConnections({ organizationId, signal: controller.signal }).then(
            (rows) =>
              rows.map((row) =>
                promoterOption(
                  row.promoterId,
                  `Promoter ${row.promoterId.slice(-8)}`,
                  'Connected promoter',
                ),
              ),
          );
    void load
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({
            requestKey,
            data,
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

    return () => {
      controller.abort();
    };
  }, [eligibility, hydrated, organizationId, requestKey]);

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

export function useConnectedPromoters(
  organizationId: string | null,
  enabled = true,
): ConnectedPromotersState {
  return usePromoterOptions(organizationId, enabled, 'connected');
}

/** Host event editor picker; options come from the canonical backend rule. */
export function useAssignablePromoters(
  organizationId: string | null,
  enabled = true,
): ConnectedPromotersState {
  return usePromoterOptions(organizationId, enabled, 'assignable');
}
