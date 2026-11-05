'use client';
import { createApiClient } from '@c1rcle/api-client';

export const socialClient = createApiClient({
  baseUrl: typeof window === 'undefined' ? '' : window.location.origin,
});
