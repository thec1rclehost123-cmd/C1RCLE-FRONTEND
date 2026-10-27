import Link from 'next/link';

export function TicketsGuestView() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 pt-28 pb-20 sm:px-8 flex-1 flex flex-col justify-center">
      {/* Page Title */}
      <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-10 select-none">
        TICKETS
      </h1>

      <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10">
        <div className="flex max-w-lg flex-col items-start">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-6 leading-[0.9]">
            Your tickets live here
          </h2>

          <p className="mb-8 text-sm font-medium leading-relaxed text-white/60">
            Sign in to view tickets connected to your account. We never show sample passes in your
            wallet.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-full bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all text-center shadow-lg shadow-white/10"
            >
              LOGIN TO ACCESS
            </Link>
            <Link
              href="/login?mode=register"
              className="px-8 py-3.5 rounded-full border border-white/20 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all text-center"
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
