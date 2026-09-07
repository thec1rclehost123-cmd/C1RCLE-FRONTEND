import Link from 'next/link';

export function ProfileLoggedOutView() {
  return (
    <section className="mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center px-6 py-32 text-center">
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
        Member access
      </p>
      <h1 className="mt-5 text-5xl font-black uppercase leading-[0.86] tracking-[-0.06em] text-white sm:text-7xl">
        Your C1RCLE lives here.
      </h1>
      <p className="mt-6 max-w-xl text-sm leading-7 text-white/45">
        Continue to login to view your profile, events and account settings.
      </p>
      <Link
        href="/login?next=/profile"
        className="mt-8 inline-flex min-h-12 items-center rounded-full bg-white px-8 text-[10px] font-black uppercase tracking-[0.22em] text-black"
      >
        Continue to login
      </Link>
    </section>
  );
}
