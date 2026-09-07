export function PublicProfileSectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <header data-profile-reveal>
      <p className="text-[9px] font-black uppercase tracking-[0.32em] text-[var(--profile-accent-text)]">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-3 max-w-5xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-6xl lg:text-7xl"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/48 sm:text-base">
          {description}
        </p>
      )}
    </header>
  );
}
