import Link from 'next/link';

import type { ReactNode } from 'react';

type ActivitySection = 'notifications' | 'following';

const sections: readonly { id: ActivitySection; label: string; href: string }[] = [
  { id: 'notifications', label: 'Notifications', href: '/notifications' },
  { id: 'following', label: 'Following', href: '/following' },
];

export function ActivityLayout({
  active,
  title,
  actions,
  children,
}: {
  readonly active: ActivitySection;
  readonly title: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="relative z-10 min-h-screen px-4 pb-24 pt-28 text-white sm:px-6 sm:pt-32 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6842]">
          Your C1RCLE
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-6xl">
            {title}
          </h1>
          {actions}
        </div>

        <nav aria-label="Activity sections" className="mt-8 flex gap-2">
          {sections.map((section) => {
            const current = section.id === active;
            return (
              <Link
                key={section.id}
                href={section.href}
                aria-current={current ? 'page' : undefined}
                className={`rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-200 motion-reduce:transition-none ${
                  current ? 'bg-white text-black' : 'bg-white/[0.06] text-white/70 hover:text-white'
                }`}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function ActivityEmptyState({
  title,
  body,
  action,
}: {
  readonly title: string;
  readonly body: string;
  readonly action?: { readonly label: string; readonly href: string };
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
      <p className="text-lg font-black uppercase tracking-[-0.02em]">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">{body}</p>
      {action !== undefined && (
        <Link
          href={action.href}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white/90"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function ActivityPager({
  olderHref,
  newestHref,
}: {
  readonly olderHref: string | null;
  readonly newestHref: string | null;
}) {
  if (olderHref === null && newestHref === null) return null;
  const linkClass =
    'inline-flex min-h-10 items-center rounded-full border border-white/15 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/80 hover:border-white/35 hover:text-white';
  return (
    <nav aria-label="Pagination" className="mt-8 flex justify-between gap-3">
      {newestHref !== null ? (
        <Link href={newestHref} className={linkClass}>
          ← Newest
        </Link>
      ) : (
        <span />
      )}
      {olderHref !== null && (
        <Link href={olderHref} className={linkClass}>
          Older →
        </Link>
      )}
    </nav>
  );
}
