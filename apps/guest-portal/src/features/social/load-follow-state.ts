import 'server-only';

import { getFollowStatus } from '@/lib/social/social-api';

import type { FollowButtonState } from './components/FollowButton';
import type { FollowTargetTypeDto } from '@c1rcle/contracts';

/**
 * Initial follow-button state for a public profile page. `null` means the
 * follow service could not be reached: the page still renders, just without
 * the button, rather than offering an action that cannot succeed.
 */
export async function loadFollowButtonState(
  targetType: FollowTargetTypeDto,
  targetId: string,
): Promise<FollowButtonState | null> {
  const result = await getFollowStatus(targetType, targetId);
  if (result.status === 'unauthenticated') return { kind: 'anonymous' };
  if (result.status === 'unavailable') return null;
  return { kind: 'ready', ...result.data };
}
