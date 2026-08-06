'use client';

export default function EventDetailError({ reset }: { reset: () => void }) {
  return (
    <main className="relative z-10 flex min-h-[75vh] items-center justify-center px-6 pb-24 pt-32 text-center text-white">
      <div className="max-w-lg rounded-[2rem] border border-red-400/20 bg-red-500/10 p-10 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF6B4A]">Event</p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">Something glitched</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          This event could not be displayed. Try loading the page again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 min-h-11 rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-black"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
