'use client';

import { useRef } from 'react';

import { WarningIcon } from '@c1rcle/icons';

import { useOverlayFocus } from '@/components/venue/useOverlayFocus';

export function ShellSignOutDialog({
  label,
  onClose,
  onConfirm,
  trigger,
}: {
  readonly label: string;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly trigger: React.RefObject<HTMLButtonElement | null>;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useOverlayFocus({
    open: true,
    containerRef: dialogRef,
    restoreFocusRef: trigger,
    onClose,
    lockScroll: true,
  });
  return (
    <div className="partner-dialog-backdrop">
      <section
        ref={dialogRef}
        className="partner-signout-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Sign out confirmation"
        tabIndex={-1}
      >
        <WarningIcon size={32} aria-hidden="true" />
        <h2>Sign out of {label}?</h2>
        <p>You’ll need to sign in again to access your account.</p>
        <button type="button" className="is-danger" onClick={onConfirm}>
          Sign out
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </section>
    </div>
  );
}
