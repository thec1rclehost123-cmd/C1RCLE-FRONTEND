'use client';

import { useEffect } from 'react';

import type { ReactNode } from 'react';

export function DashboardDrawer({
  open,
  title,
  description,
  children,
  onClose,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string | undefined;
  readonly children: ReactNode;
  readonly onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); };
  }, [onClose, open]);

  if (!open) return null;
  return <div className="pd-overlay"><button type="button" className="pd-overlay-dismiss" aria-label="Close drawer" onClick={onClose} /><aside className="pd-drawer" role="dialog" aria-modal="true" aria-labelledby="pd-drawer-title"><header><div><span>THE C1RCLE</span><h2 id="pd-drawer-title">{title}</h2>{description ? <p>{description}</p> : null}</div><button type="button" onClick={onClose} aria-label="Close">×</button></header>{children}</aside></div>;
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly busy?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  if (!open) return null;
  return <div className="pd-overlay pd-overlay--center"><button type="button" className="pd-overlay-dismiss" aria-label="Cancel" onClick={onCancel} /><section className="pd-confirm" role="alertdialog" aria-modal="true" aria-labelledby="pd-confirm-title"><span>Confirm action</span><h2 id="pd-confirm-title">{title}</h2><p>{description}</p><footer><button type="button" onClick={onCancel} disabled={busy}>Cancel</button><button type="button" className="is-primary" onClick={onConfirm} disabled={busy}>{busy ? 'Preparing…' : confirmLabel}</button></footer></section></div>;
}

export function DashboardToast({ message, tone = 'positive' }: { readonly message: string | null; readonly tone?: 'positive' | 'warning' }) {
  return message ? <div className={`pd-toast pd-toast--${tone}`} role="status"><span aria-hidden="true">{tone === 'positive' ? '✓' : '!'}</span>{message}</div> : null;
}
