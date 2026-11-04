import Image from 'next/image';

const dayFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  timeZone: 'Asia/Kolkata',
});
const monthFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  timeZone: 'Asia/Kolkata',
});
const yearFormatter = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

/** Editorial fallback only. It never implies that an event supplied poster artwork. */
export function EventArtworkFallback({
  startsAt,
  category,
  hero = false,
}: {
  startsAt: string;
  category: string;
  hero?: boolean;
}) {
  const date = new Date(startsAt);

  if (hero) {
    return (
      <div aria-hidden="true" className="relative size-full overflow-hidden">
        <div className="explore-hero-fallback-artwork absolute inset-y-0 left-1/2 aspect-square h-full -translate-x-1/2">
          <Image
            src="/c1rcle-logo.webp"
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 60vw"
            className="object-cover object-center opacity-70"
          />
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="relative size-full overflow-hidden bg-[#120d0b]">
      <Image
        src="/c1rcle-logo.webp"
        alt=""
        fill
        sizes="250px"
        className="scale-150 object-cover opacity-45 blur-[32px] saturate-150"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-[#140b08]/25 to-black/75" />
      <div className="absolute -right-[35%] top-[10%] aspect-square w-[105%] rounded-full border border-[#ff6b4a]/30 shadow-[inset_0_0_65px_rgba(255,90,43,0.12),0_0_65px_rgba(255,90,43,0.1)]" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5">
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/75">
          THE C1RCLE
        </span>
        <div>
          <span className="block text-[clamp(5rem,12vw,9rem)] font-black leading-none tracking-[-0.09em] text-white/90">
            {dayFormatter.format(date)}
          </span>
          <span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#ff9c7c]">
            {monthFormatter.format(date)} {yearFormatter.format(date)} · {category}
          </span>
        </div>
        <span className="text-[8px] font-semibold uppercase tracking-[0.22em] text-white/55">
          Event artwork unavailable
        </span>
      </div>
    </div>
  );
}
