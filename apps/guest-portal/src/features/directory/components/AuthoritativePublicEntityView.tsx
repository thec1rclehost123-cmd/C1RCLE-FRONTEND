import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

import type { HostPublicDto, VenueDto } from '@c1rcle/contracts';

export function AuthoritativeVenueView({ venue }: { readonly venue: VenueDto }) {
  return (
    <article className="relative z-10 mx-auto min-h-screen max-w-6xl px-6 pb-24 pt-32 text-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Venues', href: '/hosts' },
          { label: venue.name, href: `/venue/${venue.slug}` },
        ]}
      />
      <header className="max-w-4xl">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF6842]">
          {venue.city ?? 'Venue'}
        </p>
        <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl">
          {venue.name}
        </h1>
        {venue.description.length > 0 && (
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">{venue.description}</p>
        )}
      </header>
    </article>
  );
}

export function AuthoritativeHostView({ host }: { readonly host: HostPublicDto }) {
  return (
    <article className="relative z-10 mx-auto min-h-screen max-w-6xl px-6 pb-24 pt-32 text-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hosts', href: '/hosts' },
          { label: host.name, href: `/host/${host.slug}` },
        ]}
      />
      <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl">
        {host.name}
      </h1>
    </article>
  );
}
