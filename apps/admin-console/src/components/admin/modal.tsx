'use client';

import { useEffect } from 'react';

import { CloseIcon } from '@c1rcle/icons';
import { cn } from '@c1rcle/utils';

import type { ReactNode } from 'react';

/**
 * The admin console's one modal primitive. `packages/ui` has no
 * Dialog/Sheet component yet (see `index.ts` — Button/Card/states/TextField
 * only), so this lives here until a shared one exists. Deliberately plain:
 * a backdrop + centered panel, Escape-to-close, backdrop-click-to-close —
 * no animation library, no portal dependency, matching this app's existing
 * "no new dependencies" constraint.
 */
export interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-background/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className={cn(
          'relative w-full max-w-2xl rounded-lg border border-border bg-card text-card-foreground shadow-(--shadow-card)',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex flex-col gap-1">
            <h2 id="admin-modal-title" className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description === undefined ? null : (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-muted hover:text-foreground"
          >
            <CloseIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
