'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { formatNumber } from '@c1rcle/utils';

import { setFollowingAction } from '../actions';

import type { FollowTargetTypeDto } from '@c1rcle/contracts';

export type FollowButtonState =
  | { readonly kind: 'anonymous' }
  | { readonly kind: 'ready'; readonly following: boolean; readonly followerCount: number | null };

interface FollowButtonProps {
  readonly targetType: FollowTargetTypeDto;
  readonly targetId: string;
  readonly targetName: string;
  /** Where an anonymous guest is sent to sign in, carrying a return path. */
  readonly loginHref: string;
  readonly initialState: FollowButtonState;
  readonly variant?: 'hero' | 'compact';
}

const baseClass =
  'inline-flex items-center justify-center gap-2 rounded-full border font-black uppercase tracking-[0.2em] transition-[transform,background-color,border-color,color,opacity] duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none';

const sizeClass = {
  hero: 'min-h-12 px-6 text-[10px]',
  compact: 'min-h-10 px-5 text-[9px]',
} as const;

const followClass = 'border-transparent bg-[#FF6842] text-black hover:brightness-110';
const followingClass = 'border-white/25 bg-black/35 text-white hover:border-white/45';

function followerLabel(count: number) {
  return `${formatNumber(count, 'en-IN')} ${count === 1 ? 'follower' : 'followers'}`;
}

export function FollowButton({
  targetType,
  targetId,
  targetName,
  loginHref,
  initialState,
  variant = 'hero',
}: FollowButtonProps) {
  const [state, setState] = useState<FollowButtonState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (state.kind === 'anonymous') {
    return (
      <Link
        href={loginHref}
        className={`${baseClass} ${sizeClass[variant]} ${followClass}`}
        aria-label={`Sign in to follow ${targetName}`}
      >
        Follow
      </Link>
    );
  }

  const toggle = () => {
    const previous = state;
    const next = !previous.following;
    const delta = next ? 1 : -1;
    setError(null);
    setState({
      kind: 'ready',
      following: next,
      followerCount:
        previous.followerCount === null ? null : Math.max(0, previous.followerCount + delta),
    });

    startTransition(async () => {
      const result = await setFollowingAction(targetType, targetId, next);
      if (result.status === 'ok') {
        setState({
          kind: 'ready',
          following: result.following,
          followerCount: result.followerCount ?? previous.followerCount,
        });
      } else if (result.status === 'unauthenticated') {
        setState({ kind: 'anonymous' });
      } else {
        setState(previous);
        setError('Could not update. Try again.');
      }
    });
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={state.following}
        aria-label={state.following ? `Unfollow ${targetName}` : `Follow ${targetName}`}
        className={`${baseClass} ${sizeClass[variant]} ${state.following ? followingClass : followClass}`}
      >
        {state.following ? 'Following' : 'Follow'}
      </button>
      {variant === 'hero' && state.followerCount !== null && (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
          {followerLabel(state.followerCount)}
        </span>
      )}
      <span role="status" aria-live="polite" className="text-xs text-[#FF6842]">
        {error}
      </span>
    </div>
  );
}
