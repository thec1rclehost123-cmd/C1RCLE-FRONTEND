'use client';

import { useRouter } from 'next/navigation';

import { ErrorState } from '@/components/partner-v3/States';

import type { OverviewLoadFailure } from '@/lib/overview/load-overview-data';

/**
 * ─── Overview load failure ───────────────────────────────────────────────────
 *
 * A Client Component, for one reason: the retry affordance. `ErrorState`'s
 * `onRetry` is a function, and a Server Component cannot pass a function down —
 * it can only render `ErrorState` with no button at all, which for a screen
 * that reads six endpoints is the wrong default.
 *
 * WHY THE PAGE BRANCHES INSTEAD OF `error.tsx`: Next.js replaces a Server
 * Component's `error.message` with a generic string plus a digest in
 * **production** (see the bundled `error.md`). So a route-level `error.tsx`
 * physically cannot tell these four cases apart once deployed — by the time it
 * runs, the kind is gone. The page therefore catches `OverviewLoadError`
 * server-side, where `reason` is still intact, and this component receives the
 * kind as a plain serializable prop. The route's `error.tsx` remains the net for
 * genuinely unexpected throws, which is the right division of labour.
 *
 * This is a sibling of `FinanceLoadFailureState`, not a shared component: the
 * two surfaces have different copy, and merging them would mean one surface's
 * wording could be changed by a decision made for the other.
 */
export function OverviewLoadFailureState({ reason }: { readonly reason: OverviewLoadFailure }) {
  const router = useRouter();

  // Terminal states first: for these, "Try again" is a lie, so no button.
  if (reason === 'signed-out') {
    return (
      <ErrorState
        title="Your session has ended"
        description="Sign in again to see your dashboard. Nothing about your events or sales has changed."
      />
    );
  }

  if (reason === 'no-organization') {
    return (
      <ErrorState
        title="No organization selected"
        description="Choose the organization you manage from the switcher at the top, then come back to this page."
      />
    );
  }

  if (reason === 'forbidden') {
    return (
      <ErrorState
        title="You are not a member of this organization"
        description="Ask an owner to invite you, or switch to an organization you belong to."
      />
    );
  }

  // `api` is the only retryable kind, so it is the only one offering a retry.
  return (
    <ErrorState
      title="Could not load your overview"
      description="We could not reach the server just now. Nothing has changed — try again in a moment."
      onRetry={() => {
        router.refresh();
      }}
    />
  );
}
