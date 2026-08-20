import { createApiClient } from '@c1rcle/api-client';
import { getClientEnv } from '@c1rcle/config';

import { getAccessToken } from './token-store';

export const apiClient = createApiClient({
  baseUrl: getClientEnv().NEXT_PUBLIC_API_BASE_URL,
  getAccessToken,
  onUnauthorized() {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
});
