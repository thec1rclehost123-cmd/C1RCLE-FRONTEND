import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  ActivityEmptyState,
  ActivityLayout,
  ActivityPager,
} from '@/features/social/components/ActivityLayout';
import { FollowButton } from '@/features/social/components/FollowButton';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';
import { listMyFollows, resolveFollowTarget } from '@/lib/social/social-api';

import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Following',
  'The venues and hosts you follow on C1RCLE.',
);

export const dynamic = 'force-dynamic';

interface FollowingPageProps {
  searchParams?: Promise<{ cursor?: string | string[] }>;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(cursor?: string) {
  return cursor === undefined ? '/following' : `/following?cursor=${encodeURIComponent(cursor)}`;
}

export default async function FollowingPage({ searchParams }: FollowingPageProps = {}) {
  await requireGuestSession('/following');
  const params = (await searchParams) ?? {};
  const rawCursor = firstValue(params.cursor);
  const cursor = rawCursor !== undefined && rawCursor.length > 0 ? rawCursor : undefined;

  const result = await listMyFollows({ cursor });
  if (result.status === 'unauthenticated') {
    redirect(`/login?next=${encodeURIComponent('/following')}`);
  }

  const follows =
    result.status === 'ok'
      ? await Promise.all(
          result.data.items.map(async (follow) => ({
            follow,
            target: await resolveFollowTarget(follow.targetType, follow.targetId),
          })),
        )
      : [];

  return (
    <ActivityLayout active="following" title="Following">
      {result.status === 'unavailable' ? (
        <ActivityEmptyState
          title="Following unavailable"
          body="We couldn't load who you follow right now. Please try again in a moment."
          action={{ label: 'Retry', href: pageHref(cursor) }}
        />
      ) : follows.length === 0 ? (
        <ActivityEmptyState
          title="You're not following anyone yet"
          body="Follow venues and hosts to get notified when they publish new events."
          action={{ label: 'Find venues & hosts', href: '/hosts' }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {follows.map(({ follow, target }) => {
            const name = target?.name ?? 'Unavailable profile';
            return (
              <li
                key={follow.id}
                className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF6842]">
                    {follow.targetType === 'venue' ? 'Venue' : 'Host'}
                  </p>
                  {target !== null ? (
                    <Link
                      href={target.href}
                      className="mt-1 block truncate text-lg font-black uppercase tracking-[-0.02em] hover:text-[#FF6842]"
                    >
                      {name}
                    </Link>
                  ) : (
                    <p className="mt-1 truncate text-lg font-black uppercase tracking-[-0.02em] text-white/45">
                      {name}
                    </p>
                  )}
                </div>
                <FollowButton
                  variant="compact"
                  targetType={follow.targetType}
                  targetId={follow.targetId}
                  targetName={name}
                  loginHref={`/login?next=${encodeURIComponent('/following')}`}
                  initialState={{ kind: 'ready', following: true, followerCount: null }}
                />
              </li>
            );
          })}
        </ul>
      )}

      {result.status === 'ok' && (
        <ActivityPager
          newestHref={cursor !== undefined ? pageHref() : null}
          olderHref={result.data.nextCursor !== null ? pageHref(result.data.nextCursor) : null}
        />
      )}
    </ActivityLayout>
  );
}
