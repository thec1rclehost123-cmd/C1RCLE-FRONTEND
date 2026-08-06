import Link from 'next/link';

export default function EventDetailNotFound() {
  return (
    <main className="relative z-10 flex min-h-[75vh] items-center justify-center px-6 pb-24 pt-32 text-center text-white">
      <div className="max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
          Event unavailable
        </p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">
          This link has left the list
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          The event reference is missing, unavailable, or not part of this fixture preview.
        </p>
        <Link
          href="/explore"
          className="mt-8 inline-flex min-h-11 items-center rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-black"
        >
          Explore events
        </Link>
      </div>
    </main>
  );
}
