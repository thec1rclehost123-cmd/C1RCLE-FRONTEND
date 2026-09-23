'use client';

import { useEffect } from 'react';
import { getApiClient } from '@c1rcle/api-client';
import { z } from 'zod';

/** Counts the anonymous click; checkout independently verifies the code. */
export function PromoterClickTracker({ eventSlug, code }: { eventSlug: string; code?: string }) {
  useEffect(() => {
    if (!code) return;
    window.sessionStorage.setItem('c1rcle-promoter-referral-code', code);
    void getApiClient()
      .post({
        path: '/api/v2/public/promoter-links/click',
        body: { eventSlug, code },
        schema: z.object({ tracked: z.boolean() }),
      })
      .catch(() => undefined);
  }, [eventSlug, code]);

  return null;
}
