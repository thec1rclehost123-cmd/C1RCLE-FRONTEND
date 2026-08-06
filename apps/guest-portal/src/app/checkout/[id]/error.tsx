'use client';

export default function CheckoutError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#080808] px-6 pb-24 pt-32 text-center text-white">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
          Preview interrupted
        </p>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight">
          Checkout UI could not render.
        </h1>
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
