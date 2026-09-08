import Image from 'next/image';

import {
  PublicProfileActions,
  PublicProfileMobileCta,
} from './public-profile/PublicProfileActions';
import { PublicProfileEvents } from './public-profile/PublicProfileEvents';
import { PublicProfileGalleryClient } from './public-profile/PublicProfileGalleryClient';
import { PublicProfileSectionHeading } from './public-profile/PublicProfileSectionHeading';
import { PublicProfileShell } from './public-profile/PublicProfileShell';

import type { RestaurantVenuePublicProfile } from '../types/directory.types';

export function RestaurantVenueProfile({ profile }: { profile: RestaurantVenuePublicProfile }) {
  const signature = profile.menu.find((item) => item.image);
  const primaryAction = profile.actions[0];

  return (
    <PublicProfileShell backHref="/hosts#venues" backLabel="All venues" theme={profile.theme}>
      <article>
        <header className="relative min-h-[36rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0806] shadow-[0_40px_140px_var(--profile-accent-soft)] sm:min-h-[42rem] lg:min-h-[46rem]">
          <Image
            src={profile.hero.cover.src}
            alt={profile.hero.cover.alt}
            fill
            loading="eager"
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,3,3,0.96)_0%,rgba(3,3,3,0.72)_42%,rgba(3,3,3,0.12)_78%),linear-gradient(0deg,rgba(3,3,3,0.92)_0%,transparent_55%)]" />
          <div className="nightlife-grain absolute inset-0 opacity-[0.16]" />

          <div className="relative flex min-h-[36rem] max-w-3xl flex-col justify-end p-6 sm:min-h-[42rem] sm:p-10 lg:min-h-[46rem] lg:p-14">
            <div className="animate-home-fade-up">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full border border-[var(--profile-accent)]/40 bg-black/35 px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em] text-[var(--profile-accent-text)] backdrop-blur-md">
                  {profile.hero.eyebrow}
                </span>
                {profile.hero.verified && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/75 backdrop-blur-md">
                    <span aria-label="Verified venue" className="text-[var(--profile-accent-text)]">
                      ●
                    </span>
                    Verified
                  </span>
                )}
              </div>

              <h1 className="mt-6 max-w-3xl font-[Georgia,'Times_New_Roman',serif] text-6xl font-normal leading-[0.9] tracking-[-0.055em] text-[#F8E7C3] sm:text-8xl lg:text-[7.4rem]">
                {profile.hero.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/66 sm:text-lg">
                {profile.hero.subtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-white/55">
                <span>{profile.hero.locationLabel}</span>
                {profile.hero.statusLabel && (
                  <span className="inline-flex items-center gap-2 text-[var(--profile-accent-text)]">
                    <span className="size-1.5 rounded-full bg-[var(--profile-accent)]" />
                    {profile.hero.statusLabel}
                  </span>
                )}
              </div>

              <div className="mt-8">
                <PublicProfileActions actions={profile.actions} />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-8 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.62fr)] lg:items-center lg:gap-16">
          <div data-profile-reveal>
            <p className="font-[Georgia,'Times_New_Roman',serif] text-xl italic text-[var(--profile-accent-text)]">
              {profile.story.eyebrow}
            </p>
            <h2 className="mt-4 max-w-4xl font-[Georgia,'Times_New_Roman',serif] text-5xl font-normal leading-[0.96] tracking-[-0.045em] text-[#F8E7C3] sm:text-7xl">
              {profile.story.headline}
            </h2>
            <div className="mt-7 max-w-2xl space-y-5 text-sm leading-7 text-white/50 sm:text-base">
              {profile.story.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {profile.cuisine.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--profile-accent)]/25 bg-[var(--profile-accent-soft)] px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--profile-accent-text)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {signature?.image && (
            <div data-profile-reveal className="relative mx-auto aspect-[4/5] w-full max-w-[28rem]">
              <div className="absolute inset-[6%] rounded-full border border-[var(--profile-accent)]/30" />
              <div className="absolute inset-x-0 bottom-0 top-[2%] overflow-hidden rounded-[9rem_9rem_2rem_2rem] border border-white/10 bg-[#0A0806] shadow-[0_30px_100px_var(--profile-accent-soft)]">
                <Image
                  src={signature.image.src}
                  alt={signature.image.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 38vw"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </section>

        <section
          data-profile-reveal
          aria-labelledby="restaurant-hours-heading"
          className="rounded-[2rem] border border-white/10 bg-white/[0.025] px-5 py-7 sm:px-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--profile-accent-text)]">
                Plan your evening
              </p>
              <h2
                id="restaurant-hours-heading"
                className="mt-2 text-2xl font-black uppercase tracking-[-0.04em]"
              >
                Working hours
              </h2>
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-4xl lg:grid-cols-7">
              {profile.hours.map((entry) => (
                <div key={entry.day} className="rounded-2xl bg-black/45 px-3 py-3 text-center">
                  <dt className="text-[8px] font-black uppercase tracking-[0.16em] text-white/35">
                    {entry.day}
                  </dt>
                  <dd className="mt-1 text-[9px] font-semibold text-white/70">{entry.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="menu" className="scroll-mt-28 py-20 sm:py-28">
          <PublicProfileSectionHeading
            eyebrow="From the kitchen"
            title="A menu made for sharing"
            description="A short edit of live-fire plates, bright produce, and a bar that knows when to stay out of the way."
            id="restaurant-menu-heading"
          />

          <div data-profile-reveal className="mt-9 grid gap-4 lg:grid-cols-3">
            {profile.menu.map((item, index) => (
              <article
                key={item.id}
                className={`relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0A0806] p-6 ${index === 0 ? 'min-h-[30rem] lg:row-span-2' : 'min-h-56'}`}
              >
                {item.image && (
                  <>
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 34vw"
                      className="object-cover opacity-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  </>
                )}
                <div className="relative flex h-full flex-col justify-end">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[var(--profile-accent-text)]">
                    Course {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-3xl text-[#F8E7C3]">
                    {item.name}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">
                    {item.description}
                  </p>
                  {item.priceLabel && (
                    <p className="mt-5 text-xs font-black tracking-[0.14em] text-white/70">
                      {item.priceLabel}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="restaurant-gallery-heading" className="pb-20 sm:pb-28">
          <PublicProfileSectionHeading
            eyebrow="Inside the room"
            title="Dinner, drinks, then whatever happens next"
            id="restaurant-gallery-heading"
          />
          <div className="mt-9">
            <PublicProfileGalleryClient items={profile.gallery} />
          </div>
        </section>

        <PublicProfileEvents
          events={profile.events}
          eyebrow="After dinner"
          title="Happening at Skyline"
        />

        <section
          id="reservations"
          data-profile-reveal
          className="scroll-mt-28 overflow-hidden rounded-[2.25rem] border border-[var(--profile-accent)]/25 bg-[linear-gradient(135deg,var(--profile-accent-soft),rgba(8,6,4,0.92)_55%)] p-6 sm:p-10 lg:p-14"
        >
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <p className="font-[Georgia,'Times_New_Roman',serif] text-xl italic text-[var(--profile-accent-text)]">
                Your table is waiting
              </p>
              <h2 className="mt-3 max-w-4xl font-[Georgia,'Times_New_Roman',serif] text-5xl leading-[0.95] tracking-[-0.045em] text-[#F8E7C3] sm:text-7xl">
                Come for dinner. Stay for the room.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/52">
                {profile.reservationNote}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/40 p-5 backdrop-blur-xl">
              <p className="text-xs font-semibold text-white">{profile.contact.address}</p>
              <p className="mt-2 text-xs text-white/45">{profile.contact.phone}</p>
              <div className="mt-5">
                <PublicProfileActions actions={profile.actions.slice(1)} />
              </div>
            </div>
          </div>
        </section>
      </article>

      {primaryAction && <PublicProfileMobileCta action={primaryAction} />}
    </PublicProfileShell>
  );
}
