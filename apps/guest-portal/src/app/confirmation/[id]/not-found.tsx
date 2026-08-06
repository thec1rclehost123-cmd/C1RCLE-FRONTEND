import Link from 'next/link';

export default function ConfirmationNotFound() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#080808] px-6 pb-24 pt-32 text-center text-white">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
          Confirmation unavailable
        </p>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight">
          That fixture order could not be found.
        </h1>
        <Link
          href="/tickets"
          className="mt-8 inline-flex min-h-11 items-center rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-black"
        >
          Open ticket previews
        </Link>
      </div>
    </main>
  );
}
