import Link from 'next/link';

export default function VenueProfileNotFound() {
  return (
    <div className="relative z-10 flex min-h-[75vh] items-center justify-center px-6 pb-24 pt-32 text-center text-white">
      <div className="max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#B889DF]">
          Venue unavailable
        </p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">
          This room is off the circuit
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          The venue reference is missing, unavailable, or no longer public.
        </p>
        <Link
          href="/hosts#venues"
          className="mt-8 inline-flex min-h-11 items-center rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-black"
        >
          Explore venues
        </Link>
      </div>
    </div>
  );
}
