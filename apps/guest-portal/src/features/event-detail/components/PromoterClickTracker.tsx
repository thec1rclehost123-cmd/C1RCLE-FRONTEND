'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { z } from 'zod';

import { getApiClient } from '@c1rcle/api-client';

const SESSION_KEY = 'c1rcle-promoter-referral-context';
const CLICK_DEDUPE_KEY = 'c1rcle-promoter-click-dedupe';
const CLICK_DEDUPE_WINDOW_MS = 250;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CONTEXT_CHANGE_EVENT = 'c1rcle-promoter-referral-context-change';

function notifyContextChanged() {
  window.dispatchEvent(new Event(CONTEXT_CHANGE_EVENT));
}

interface ReferralContext {
  readonly eventSlug: string;
  readonly code: string;
  readonly contextToken: string;
  readonly capturedAt: number;
}

/** Counts the anonymous click; checkout independently verifies the signed context. */
export function PromoterClickTracker({ eventSlug, code }: { eventSlug: string; code?: string }) {
  useEffect(() => {
    if (!code) return;
    if (hasRecentClickAttempt(eventSlug, code)) return;
    markClickAttempt(eventSlug, code);
    const clickId = window.crypto.randomUUID();
    const previousContext = readStoredContexts().find((item) => item.eventSlug === eventSlug);
    void getApiClient()
      .post({
        path: '/api/v2/public/promoter-links/click',
        body: {
          eventSlug,
          code,
          clickId,
          ...(previousContext ? { contextToken: previousContext.contextToken } : {}),
        },
        schema: z.object({ accepted: z.literal(true), contextToken: z.string().min(16) }),
      })
      .then(({ contextToken }) => {
        const contexts = readStoredContexts();
        const next: ReferralContext = { eventSlug, code, contextToken, capturedAt: Date.now() };
        // Retain a bounded event-specific click history. The server sorts by
        // signed click time and falls back past invalid or revoked candidates.
        const updated = [next, ...contexts.filter((item) => item.eventSlug !== eventSlug)]
          .filter((item) => Date.now() - item.capturedAt <= MAX_AGE_MS)
          .slice(0, 100);
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        notifyContextChanged();
      })
      .catch(() => undefined);
  }, [eventSlug, code]);

  return null;
}

function hasRecentClickAttempt(eventSlug: string, code: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(CLICK_DEDUPE_KEY);
    if (!raw) return false;
    const value: unknown = JSON.parse(raw);
    if (
      typeof value !== 'object' ||
      value === null ||
      !('eventSlug' in value) ||
      !('code' in value) ||
      !('attemptedAt' in value) ||
      value.eventSlug !== eventSlug ||
      value.code !== code ||
      typeof value.attemptedAt !== 'number'
    ) {
      return false;
    }
    const age = Date.now() - value.attemptedAt;
    return age >= 0 && age < CLICK_DEDUPE_WINDOW_MS;
  } catch {
    return false;
  }
}

function markClickAttempt(eventSlug: string, code: string): void {
  try {
    window.sessionStorage.setItem(
      CLICK_DEDUPE_KEY,
      JSON.stringify({ eventSlug, code, attemptedAt: Date.now() }),
    );
  } catch {
    // Click tracking remains best effort when browser storage is unavailable.
  }
}

/** Subscribe React UI to same-tab and cross-tab session-storage changes. */
export function usePromoterReferralContext(eventSlug: string): string | null {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CONTEXT_CHANGE_EVENT, onChange);
      window.addEventListener('storage', onChange);
      return () => {
        window.removeEventListener(CONTEXT_CHANGE_EVENT, onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    () => readPromoterReferralContext(eventSlug),
    () => null,
  );
}

/** Server-signed click history for exactly this event, newest first. */
export function usePromoterReferralContextTokens(eventSlug: string): string {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CONTEXT_CHANGE_EVENT, onChange);
      window.addEventListener('storage', onChange);
      return () => {
        window.removeEventListener(CONTEXT_CHANGE_EVENT, onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    () => JSON.stringify(readPromoterReferralContextTokens(eventSlug)),
    () => '[]',
  );
}

export function readPromoterReferralContextTokens(eventSlug: string): readonly string[] {
  return readStoredContexts()
    .filter((item) => item.eventSlug === eventSlug)
    .sort((left, right) => right.capturedAt - left.capturedAt)
    .slice(0, 20)
    .map((item) => item.contextToken);
}

/** Navigation convenience only; the backend validates every quote and hold. */
export function readPromoterReferralContext(eventSlug: string): string | null {
  try {
    return (
      readStoredContexts()
        .filter((item) => item.eventSlug === eventSlug)
        .sort((left, right) => right.capturedAt - left.capturedAt)[0]?.code ?? null
    );
  } catch {
    return null;
  }
}

function readStoredContexts(): ReferralContext[] {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    const values = Array.isArray(value) ? value : [value];
    return values.filter(isFreshContext);
  } catch {
    return [];
  }
}

function isFreshContext(value: unknown): value is ReferralContext {
  return (
    typeof value === 'object' &&
    value !== null &&
    'eventSlug' in value &&
    typeof value.eventSlug === 'string' &&
    'code' in value &&
    typeof value.code === 'string' &&
    'contextToken' in value &&
    typeof value.contextToken === 'string' &&
    'capturedAt' in value &&
    typeof value.capturedAt === 'number' &&
    Date.now() - value.capturedAt >= 0 &&
    Date.now() - value.capturedAt <= MAX_AGE_MS
  );
}
