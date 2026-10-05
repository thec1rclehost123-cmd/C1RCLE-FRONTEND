import { useRef } from 'react';

/**
 * Safari (and others) block `window.open` that runs after an `await`. The
 * window is therefore opened synchronously inside the click handler, then
 * pointed at the signed URL once it resolves. Blocked pop-up -> same-tab
 * navigation fallback.
 */
export function preOpenWindow(): Window | null {
  const w = window.open('about:blank', '_blank');
  if (w) {
    try {
      w.opener = null;
    } catch {
      // cross-origin opener assignment can throw; the window is still usable
    }
  }
  return w;
}

export function showInWindow(w: Window | null, url: string): void {
  if (w && !w.closed) {
    w.location.href = url;
    return;
  }
  window.location.assign(url);
}

export function abandonWindow(w: Window | null): void {
  if (w && !w.closed) {
    w.close();
  }
}

export function useDocumentWindow() {
  const ref = useRef<Window | null>(null);
  return {
    preOpen: () => {
      ref.current = preOpenWindow();
    },
    show: (url: string) => {
      showInWindow(ref.current, url);
      ref.current = null;
    },
    abort: () => {
      abandonWindow(ref.current);
      ref.current = null;
    },
  };
}
