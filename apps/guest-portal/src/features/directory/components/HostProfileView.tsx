import Image from 'next/image';

import {
  PublicProfileActions,
  PublicProfileMobileCta,
} from './public-profile/PublicProfileActions';
import { PublicProfileEvents } from './public-profile/PublicProfileEvents';
import { PublicProfileGalleryClient } from './public-profile/PublicProfileGalleryClient';
import { PublicProfileSectionHeading } from './public-profile/PublicProfileSectionHeading';
import { PublicProfileShell } from './public-profile/PublicProfileShell';

import type { HostPublicProfile } from '../types/directory.types';

export function HostProfileView({ host }: { host: HostPublicProfile }) {
  const primaryAction = host.actions[0];
  const initials = host.hero.title
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2);

  return (
    <PublicProfileShell
      backHref="/hosts"
      backLabel="All hosts"
      currentHref={`/host/${host.id}`}
      currentLabel={host.hero.title}
      theme={host.theme}
    >
      <article>
        <header className="relative min-h-[40rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707] shadow-[0_40px_140px_var(--profile-accent-soft)] sm:min-h-[45rem]">
          <Image
            src={host.hero.cover.src}
            alt={host.hero.cover.alt}
            fill
            loading="eager"
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.74)_55%,rgba(0,0,0,0.22)_86%),linear-gradient(0deg,rgba(0,0,0,0.93),transparent_58%)]" />
          <div className="nightlife-grain absolute inset-0 opacity-[0.2]" />

          <div className="relative flex min-h-[40rem] max-w-5xl flex-col justify-end p-6 sm:min-h-[45rem] sm:p-10 lg:p-14">
            <div className="animate-home-fade-up">
              <div className="flex items-center gap-4">
                <div className="flex size-20 items-center justify-center rounded-[1.5rem] border border-white/20 bg-[var(--profile-accent)] text-2xl font-black tracking-[-0.06em] text-black shadow-2xl sm:size-24">
                  {initials}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.26em] text-[var(--profile-accent-text)]">
                      {host.role}
                    </span>
                    {host.hero.verified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white/70">
                        <span
                          aria-label="Verified host"
                          className="text-[var(--profile-accent-text)]"
                        >
                          ●
                        </span>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-white/45">@{host.handle}</p>
                </div>
              </div>

              <h1 className="mt-7 max-w-5xl text-6xl font-black uppercase leading-[0.82] tracking-[-0.075em] sm:text-8xl lg:text-[8rem]">
                {host.hero.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                {host.hero.subtitle}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-white/48">
                <span>{host.hero.locationLabel}</span>
                {host.hero.statusLabel && (
                  <span className="text-[var(--profile-accent-text)]">{host.hero.statusLabel}</span>
                )}
              </div>
              <div className="mt-8">
                <PublicProfileActions actions={host.actions} />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-8 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.55fr)] lg:gap-14">
          <div data-profile-reveal>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--profile-accent-text)]">
              About the host
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] sm:text-6xl">
              {host.hero.subtitle}
            </h2>
            <p className="mt-7 max-w-3xl text-sm leading-7 text-white/50 sm:text-base">
              {host.bio}
            </p>
          </div>
          <div
            data-profile-reveal
            className="flex flex-wrap content-start gap-2 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            {host.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/55"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section aria-labelledby="host-prompts-heading" className="pb-20 sm:pb-28">
          <PublicProfileSectionHeading
            eyebrow="A little closer"
            title="This is how we build a night"
            id="host-prompts-heading"
          />
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {host.prompts.map((prompt, index) => (
              <article
                key={prompt.id}
                data-profile-reveal
                className={`relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8 ${index === 0 ? 'lg:col-span-2' : ''}`}
              >
                {prompt.image && (
                  <>
                    <Image
                      src={prompt.image.src}
                      alt={prompt.image.alt}
                      fill
                      sizes={
                        index === 0
                          ? '(max-width: 1024px) 100vw, 66vw'
                          : '(max-width: 1024px) 100vw, 33vw'
                      }
                      className="object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
                  </>
                )}
                <div className="relative flex h-full flex-col justify-end">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--profile-accent-text)]">
                    {prompt.prompt}
                  </p>
                  <p className="mt-5 max-w-2xl text-3xl font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-4xl">
                    {prompt.answer}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="host-series-heading" className="pb-20 sm:pb-28">
          <PublicProfileSectionHeading
            eyebrow="Recurring worlds"
            title="Signature series"
            id="host-series-heading"
          />
          <div className="mt-9 grid gap-5 lg:grid-cols-2">
            {host.series.map((series) => (
              <article
                key={series.id}
                data-profile-reveal
                className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] sm:grid-cols-[15rem_minmax(0,1fr)]"
              >
                <div className="relative min-h-72 sm:min-h-full">
                  <Image
                    src={series.image.src}
                    alt={series.image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 240px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[var(--profile-accent-text)]">
                    {series.venueLabel}
                  </p>
                  <h3 className="mt-3 text-4xl font-black uppercase tracking-[-0.055em]">
                    {series.name}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-white/48">{series.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="host-gallery-heading" className="pb-20 sm:pb-28">
          <PublicProfileSectionHeading
            eyebrow="From the camera roll"
            title="The people make the room"
            id="host-gallery-heading"
          />
          <div className="mt-9">
            <PublicProfileGalleryClient items={host.gallery} />
          </div>
        </section>

        <PublicProfileEvents events={host.events} />

        <section
          data-profile-reveal
          className="rounded-[2.25rem] border border-[var(--profile-accent)]/25 bg-[linear-gradient(135deg,var(--profile-accent-soft),rgba(4,4,4,0.95)_65%)] p-6 sm:p-10 lg:p-14"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--profile-accent-text)]">
            Stay close
          </p>
          <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl">
                The next room is never far away.
              </h2>
              <p className="mt-5 text-sm font-semibold text-white/45">{host.contact.instagram}</p>
            </div>
            <PublicProfileActions actions={host.actions.slice(1)} />
          </div>
        </section>
      </article>

      {primaryAction && <PublicProfileMobileCta action={primaryAction} />}
    </PublicProfileShell>
  );
}
