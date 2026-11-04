import type { ReactNode } from 'react';

export function GuestSkeleton({
  label,
  children,
  className = '',
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      aria-label={label}
      aria-busy="true"
      role="status"
      className={`relative z-10 animate-pulse motion-reduce:animate-none ${className}`}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function SkeletonBlock({ className = '' }: { readonly className?: string }) {
  return <div aria-hidden="true" className={`bg-white/[0.055] ${className}`} />;
}

export function PosterGridSkeleton({ count = 8 }: { readonly count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonBlock key={index} className="aspect-[4/5] rounded-2xl" />
      ))}
    </div>
  );
}
