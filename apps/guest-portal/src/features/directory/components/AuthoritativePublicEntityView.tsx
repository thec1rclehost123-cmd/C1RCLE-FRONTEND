import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FollowButton } from '@/features/social/components/FollowButton';

import type { FollowButtonState } from '@/features/social/components/FollowButton';
import type { HostPublicDto, VenuePublicDetailDto } from '@c1rcle/contracts';

function loginHrefFor(returnTo: string) {
  return `/login?next=${encodeURIComponent(returnTo)}`;
}

export function AuthoritativeVenueView({
  venue,
  followState = null,
}: {
  readonly venue: VenuePublicDetailDto;
  readonly followState?: FollowButtonState | null;
}) {
  const path = `/venue/${venue.slug}`;

  return (
    <article className="relative z-10 mx-auto min-h-screen max-w-6xl px-6 pb-24 pt-32 text-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Venues', href: '/hosts' },
          { label: venue.name, href: path },
        ]}
      />
      <header className="max-w-4xl">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF6842]">
          {venue.address.city ?? venue.city ?? 'Venue'}
        </p>
        <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl">
          {venue.name}
        </h1>
        {venue.description.length > 0 && (
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">{venue.description}</p>
        )}
        {followState !== null && (
          <div className="mt-8">
            <FollowButton
              targetType="venue"
              targetId={venue.id}
              targetName={venue.name}
              loginHref={loginHrefFor(path)}
              initialState={followState}
            />
          </div>
        )}
      </header>
    </article>
  );
}

export function AuthoritativeHostView({
  host,
  followState = null,
}: {
  readonly host: HostPublicDto;
  readonly followState?: FollowButtonState | null;
}) {
  const path = `/host/${host.slug}`;

  return (
    <article className="relative z-10 mx-auto min-h-screen max-w-6xl px-6 pb-24 pt-32 text-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hosts', href: '/hosts' },
          { label: host.name, href: path },
        ]}
      />
      <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl">
        {host.name}
      </h1>
      {followState !== null && (
        <div className="mt-8">
          <FollowButton
            targetType="host"
            targetId={host.id}
            targetName={host.name}
            loginHref={loginHrefFor(path)}
            initialState={followState}
          />
        </div>
      )}
    </article>
  );
}
