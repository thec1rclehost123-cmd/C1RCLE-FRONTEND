'use client';

export default function SearchError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-[75vh] items-center justify-center px-6 pb-24 pt-32 text-center text-white">
      <section className="max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#FF6842]">Search</p>
        <h1 className="mt-4 font-heading text-3xl font-black">Events are unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          We could not load public events right now. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 min-h-11 rounded-full bg-white px-6 text-xs font-black uppercase tracking-wider text-black"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
