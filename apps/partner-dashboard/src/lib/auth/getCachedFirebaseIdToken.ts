import { getAccessToken } from '@c1rcle/auth';

export function getCachedFirebaseIdToken(_user: unknown): string {
  return getAccessToken() ?? '';
}
