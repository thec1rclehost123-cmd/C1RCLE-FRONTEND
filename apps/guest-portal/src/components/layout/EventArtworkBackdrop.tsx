import Image from 'next/image';

/** Keeps the current event's color present behind long-form guest pages. */
export function EventArtworkBackdrop({ image }: { image?: string | null }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
    >
      {image && image !== '/c1rcle-logo.webp' ? (
        <Image
          src={image}
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="scale-110 object-cover opacity-35 blur-[18px] brightness-[0.42] saturate-[1.1] sm:blur-[48px]"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.48)_78%,rgba(0,0,0,0.68)_100%)]" />
    </div>
  );
}
