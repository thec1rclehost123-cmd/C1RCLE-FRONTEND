import { createApiClient } from '@c1rcle/api-client';
import { getClientEnv } from '@c1rcle/config';
import { getAccessToken, getAuthClient } from '@c1rcle/auth';

const authClient = getAuthClient();

export const apiClient = createApiClient({
  baseUrl: getClientEnv().NEXT_PUBLIC_API_BASE_URL,
  getAccessToken,
  refreshSession: async () => {
    const user = await authClient.refreshSession();
    return user ? getAccessToken() : null;
  },
  onUnauthorized() {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
});
