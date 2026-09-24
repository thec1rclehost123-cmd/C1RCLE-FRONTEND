import Link from 'next/link';

import { HomePartyVideoClient } from './HomePartyVideoClient';

export function HomeAppReview() {
  return (
    <>
      <section
        aria-labelledby="home-app-review-heading"
        className="defer-offscreen-render flex flex-col items-center justify-center bg-black px-6 py-24 text-white md:py-32"
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2
            id="home-app-review-heading"
            className="mb-12 text-2xl font-medium italic leading-tight tracking-tight text-zinc-100 md:text-4xl md:leading-snug"
          >
            “The only app you need to navigate the city after dark. Find the right room, get on the
            list, and just walk in.”
          </h2>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <StoreLink href="/app" store="apple" />
            <StoreLink href="/app" store="google" />
          </div>
        </div>
      </section>

      <section
        aria-label="Life inside THE C1RCLE"
        className="defer-offscreen-render relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-black"
      >
        <HomePartyVideoClient
          desktopSrc="/home/video/party-desktop.m4v"
          mobileSrc="/home/video/party-mobile.m4v"
          posterSrc="/home/video/party-poster.webp"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />
      </section>
    </>
  );
}

function StoreLink({ href, store }: { href: string; store: 'apple' | 'google' }) {
  const apple = store === 'apple';

  return (
    <Link
      href={href}
      className="flex w-[210px] items-center justify-center gap-3 rounded-xl border border-white/20 bg-black px-5 py-2.5 text-white transition-colors hover:bg-zinc-900 motion-reduce:transition-none"
    >
      {apple ? <AppleIcon /> : <GooglePlayIcon />}
      <span className="flex flex-col text-left">
        <span className="mb-1 text-[10px] font-medium leading-none">
          {apple ? 'Download on the' : 'GET IT ON'}
        </span>
        <span className="text-[19px] font-semibold leading-none">
          {apple ? 'App Store' : 'Google Play'}
        </span>
      </span>
    </Link>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 384 512" className="size-7 fill-current">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 256 283" className="size-7">
      <path
        fill="#ea4335"
        d="M119.553 134.916 1.06 259.061a32.14 32.14 0 0 0 47.062 19.071l133.327-75.934z"
      />
      <path
        fill="#fbbc04"
        d="m239.37 113.814-57.655-33.024-64.898 56.95 65.162 64.28 57.216-32.67a31.345 31.345 0 0 0 0-55.537z"
      />
      <path
        fill="#4285f4"
        d="M1.06 23.487A30.6 30.6 0 0 0 0 31.61v219.327a32.3 32.3 0 0 0 1.06 8.124l122.555-120.966z"
      />
      <path
        fill="#34a853"
        d="m120.436 141.274 61.278-60.483L48.564 4.503A32.85 32.85 0 0 0 32.051 0C17.644-.028 4.978 9.534 1.06 23.399z"
      />
    </svg>
  );
}
