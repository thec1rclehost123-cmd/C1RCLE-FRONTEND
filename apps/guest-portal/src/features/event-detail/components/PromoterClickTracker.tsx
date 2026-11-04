'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { z } from 'zod';

import { getApiClient } from '@c1rcle/api-client';

const SESSION_KEY = 'c1rcle-promoter-referral-context';
const CLICK_DEDUPE_KEY = 'c1rcle-promoter-click-dedupe';
const CLICK_DEDUPE_WINDOW_MS = 30_000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CONTEXT_CHANGE_EVENT = 'c1rcle-promoter-referral-context-change';

function notifyContextChanged() {
  window.dispatchEvent(new Event(CONTEXT_CHANGE_EVENT));
}

/** Counts the anonymous click; checkout independently verifies the code. */
export function PromoterClickTracker({ eventSlug, code }: { eventSlug: string; code?: string }) {
  useEffect(() => {
    if (!code) return;
    if (hasRecentClickAttempt(eventSlug, code)) return;
    markClickAttempt(eventSlug, code);
    const clickId = window.crypto.randomUUID();
    void getApiClient()
      .post({
        path: '/api/v2/public/promoter-links/click',
        body: { eventSlug, code, clickId },
        schema: z.object({ accepted: z.literal(true) }),
      })
      .then(() => {
        window.sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ eventSlug, code, capturedAt: Date.now() }),
        );
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

/** Navigation convenience only; the backend validates every quote and hold. */
export function readPromoterReferralContext(eventSlug: string): string | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      typeof value !== 'object' ||
      value === null ||
      !('eventSlug' in value) ||
      !('code' in value) ||
      !('capturedAt' in value) ||
      value.eventSlug !== eventSlug ||
      typeof value.code !== 'string' ||
      typeof value.capturedAt !== 'number' ||
      Date.now() - value.capturedAt > MAX_AGE_MS ||
      Date.now() < value.capturedAt
    ) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return value.code;
  } catch {
    return null;
  }
}
