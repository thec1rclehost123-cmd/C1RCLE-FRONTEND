import Image from 'next/image';
import Link from 'next/link';

import { findHostDirectoryFixture } from '../fixtures/directory.fixture';

import { PublicProfileActions, PublicProfileMobileCta } from './public-profile/PublicProfileActions';
import { PublicProfileEvents } from './public-profile/PublicProfileEvents';
import { PublicProfileGalleryClient } from './public-profile/PublicProfileGalleryClient';
import { PublicProfileSectionHeading } from './public-profile/PublicProfileSectionHeading';
import { PublicProfileShell } from './public-profile/PublicProfileShell';

import type { ExperienceVenuePublicProfile } from '../types/directory.types';

export function ExperienceVenueProfile({ profile }: { profile: ExperienceVenuePublicProfile }) {
  const primaryAction = profile.actions[0];
  const collaborators = profile.collaboratorHostIds
    .map((hostId) => findHostDirectoryFixture(hostId))
    .filter((host) => host !== undefined);

  return (
    <PublicProfileShell backHref="/hosts#venues" backLabel="All venues" theme={profile.theme}>
      <article>
        <header className="relative min-h-[38rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-[0_40px_140px_var(--profile-accent-soft)] sm:min-h-[44rem]">
          <Image
            src={profile.hero.cover.src}
            alt={profile.hero.cover.alt}
            fill
            loading="eager"
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.72)_48%,rgba(0,0,0,0.18)_82%),linear-gradient(0deg,rgba(0,0,0,0.9),transparent_62%)]" />
          <div className="nightlife-grain absolute inset-0 opacity-[0.2]" />

          <div className="relative flex min-h-[38rem] max-w-5xl flex-col justify-end p-6 sm:min-h-[44rem] sm:p-10 lg:p-14">
            <div className="animate-home-fade-up">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full border border-[var(--profile-accent)]/35 bg-black/40 px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em] text-[var(--profile-accent-text)] backdrop-blur-md">
                  {profile.hero.eyebrow}
                </span>
                {profile.hero.verified && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/70 backdrop-blur-md">
                    <span aria-label="Verified venue" className="text-[var(--profile-accent-text)]">●</span>
                    Verified
                  </span>
                )}
              </div>
              <h1 className="mt-6 max-w-5xl text-6xl font-black uppercase leading-[0.82] tracking-[-0.075em] text-white sm:text-8xl lg:text-[8.5rem]">
                {profile.hero.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
                {profile.hero.subtitle}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-white/50">
                <span>{profile.hero.locationLabel}</span>
                {profile.hero.statusLabel && (
                  <span className="inline-flex items-center gap-2 text-[var(--profile-accent-text)]">
                    <span className="size-1.5 rounded-full bg-[var(--profile-accent)]" />
                    {profile.hero.statusLabel}
                  </span>
                )}
              </div>
              <div className="mt-8"><PublicProfileActions actions={profile.actions} /></div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.5fr)] lg:gap-12">
          <div data-profile-reveal>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--profile-accent-text)]">The room</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              {profile.summary}
            </h2>
            <div className="mt-7 flex flex-wrap gap-2">
              {profile.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[9px] font-black uppercase tracking-[0.17em] text-white/55">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <dl data-profile-reveal className="grid grid-cols-2 gap-3 self-start rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="col-span-2 rounded-2xl bg-black/55 p-5">
              <dt className="text-[8px] font-black uppercase tracking-[0.18em] text-white/35">Capacity</dt>
              <dd className="mt-2 text-2xl font-black text-white">{profile.capacityLabel}</dd>
            </div>
            <div className="rounded-2xl bg-black/55 p-5">
              <dt className="text-[8px] font-black uppercase tracking-[0.18em] text-white/35">Formats</dt>
              <dd className="mt-2 text-3xl font-black text-[var(--profile-accent-text)]">{profile.formats.length}</dd>
            </div>
            <div className="rounded-2xl bg-black/55 p-5">
              <dt className="text-[8px] font-black uppercase tracking-[0.18em] text-white/35">Events</dt>
              <dd className="mt-2 text-3xl font-black text-[var(--profile-accent-text)]">{profile.events.length}</dd>
            </div>
          </dl>
        </section>

        <PublicProfileEvents events={profile.events} eyebrow="Live here" title="What is happening next" />

        <section aria-labelledby="venue-tour-heading" className="pb-20 sm:pb-28">
          <PublicProfileSectionHeading eyebrow="Visual tour" title="The room changes with the night" id="venue-tour-heading" />
          <div className="mt-9"><PublicProfileGalleryClient items={profile.gallery} /></div>
        </section>

        <section aria-labelledby="venue-spaces-heading" className="pb-20 sm:pb-28">
          <PublicProfileSectionHeading eyebrow="Built to transform" title="Spaces and formats" id="venue-spaces-heading" />
          <div data-profile-reveal className="mt-9 grid gap-4 lg:grid-cols-2">
            {profile.spaces.map((space, index) => (
              <article key={space.id} className="relative min-h-72 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <span className="absolute right-5 top-3 text-7xl font-black tracking-[-0.08em] text-white/[0.035]">0{index + 1}</span>
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[var(--profile-accent-text)]">{space.meta}</p>
                <h3 className="mt-16 text-4xl font-black uppercase tracking-[-0.05em]">{space.name}</h3>
                <p className="mt-4 max-w-lg text-sm leading-7 text-white/48">{space.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 pb-20 sm:pb-28 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.58fr)]">
          <div data-profile-reveal className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--profile-accent-text)]">At a glance</p>
            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em]">Ready for the full build</h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {profile.amenities.map((amenity) => (
                <li key={amenity} className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 text-xs font-semibold text-white/65">
                  <span aria-hidden="true" className="size-2 rounded-full bg-[var(--profile-accent)]" />
                  {amenity}
                </li>
              ))}
            </ul>
          </div>

          <div id="contact" data-profile-reveal className="scroll-mt-28 rounded-[2rem] border border-[var(--profile-accent)]/25 bg-[linear-gradient(145deg,var(--profile-accent-soft),rgba(5,5,5,0.94)_68%)] p-6 sm:p-8">
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--profile-accent-text)]">Location and hire</p>
            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em]">Make the room yours</h2>
            <p className="mt-5 text-sm leading-7 text-white/50">{profile.policyNote}</p>
            <p className="mt-7 text-sm font-bold text-white">{profile.contact.address}</p>
            <div className="mt-6"><PublicProfileActions actions={profile.actions.slice(1)} /></div>
          </div>
        </section>

        {collaborators.length > 0 && (
          <section data-profile-reveal aria-labelledby="venue-collaborators-heading" className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <PublicProfileSectionHeading eyebrow="Regular collaborators" title="People who shape this room" id="venue-collaborators-heading" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {collaborators.map((host) => (
                <Link key={host.id} href={`/host/${host.id}`} className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-black/45 p-4 transition-colors hover:border-[var(--profile-accent)]/45">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--profile-accent)] text-sm font-black text-black">{host.initials}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black uppercase tracking-[-0.02em]">{host.name}</span>
                    <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.17em] text-white/35">{host.role}</span>
                  </span>
                  <span aria-hidden="true" className="ml-auto text-white/35 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      {primaryAction && <PublicProfileMobileCta action={primaryAction} />}
    </PublicProfileShell>
  );
}
