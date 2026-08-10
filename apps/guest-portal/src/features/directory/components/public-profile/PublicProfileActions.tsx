import Link from 'next/link';

import type { PublicProfileAction } from '../../types/directory.types';

const toneClasses: Record<PublicProfileAction['tone'], string> = {
  primary:
    'border-transparent bg-[var(--profile-accent)] text-black hover:brightness-110 shadow-[0_16px_50px_var(--profile-accent-soft)]',
  secondary: 'border-white/20 bg-white text-black hover:bg-white/90',
  quiet: 'border-white/15 bg-black/35 text-white hover:border-white/30 hover:bg-white/[0.08]',
};

export function PublicProfileActions({ actions }: { actions: readonly PublicProfileAction[] }) {
  return (
    <div className="flex flex-wrap gap-2.5" aria-label="Profile actions">
      {actions.map((action) => {
        const className = `inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-[transform,background-color,border-color,filter] duration-300 hover:-translate-y-0.5 motion-reduce:transition-none ${toneClasses[action.tone]} ${action.disabled ? 'cursor-not-allowed opacity-45 hover:translate-y-0' : ''}`;

        if (action.disabled || !action.href) {
          return (
            <button key={action.id} type="button" disabled className={className}>
              {action.label}
            </button>
          );
        }

        if (action.external) {
          return (
            <a
              key={action.id}
              href={action.href}
              target="_blank"
              rel="noreferrer"
              className={className}
            >
              {action.label}
              <span aria-hidden="true" className="ml-2">
                ↗
              </span>
            </a>
          );
        }

        return (
          <Link key={action.id} href={action.href} className={className}>
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}

export function PublicProfileMobileCta({ action }: { action: PublicProfileAction }) {
  if (!action.href || action.disabled) return null;

  const className =
    'fixed inset-x-4 bottom-4 z-40 flex min-h-14 items-center justify-center rounded-full border border-white/15 bg-[var(--profile-accent)] px-6 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-[0_16px_60px_rgba(0,0,0,0.65)] md:hidden';

  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noreferrer" className={className}>
        {action.label}
      </a>
    );
  }

  return (
    <Link href={action.href} className={className}>
      {action.label}
    </Link>
  );
}
