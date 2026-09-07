'use client';

import { useEffect } from 'react';

import type { RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useOverlayFocus({
  containerRef,
  open,
  onClose,
  restoreFocusRef,
  lockScroll = false,
}: {
  readonly containerRef: RefObject<HTMLElement | null>;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly restoreFocusRef?: RefObject<HTMLElement | null>;
  readonly lockScroll?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const restoreTarget = restoreFocusRef?.current ?? previouslyFocused;
    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = 'hidden';

    const focusFirst = () => {
      const first = containerRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? containerRef.current)?.focus();
    };
    window.setTimeout(focusFirst, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !containerRef.current) return;
      const focusable = [...containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true',
      );
      if (!focusable.length) {
        event.preventDefault();
        containerRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (lockScroll) document.body.style.overflow = previousOverflow;
      window.setTimeout(() => restoreTarget?.focus(), 0);
    };
  }, [containerRef, lockScroll, onClose, open, restoreFocusRef]);
}
