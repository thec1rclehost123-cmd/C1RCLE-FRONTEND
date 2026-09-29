import { useEffect, useState } from 'react';

/**
 * Module-level toast state (no context provider needed for a single
 * concurrent toast) — matches the reference's `flash(t)` behavior: shows
 * a message, auto-clears after ~1.8s, a newer flash replaces the pending
 * clear timer rather than stacking two clears.
 */

type Listener = (message: string | null) => void;

let current: string | null = null;
const listeners = new Set<Listener>();
let clearTimer: ReturnType<typeof setTimeout> | null = null;

function notify(): void {
  for (const listener of listeners) listener(current);
}

export function showToast(message: string): void {
  current = message;
  notify();
  if (clearTimer !== null) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    current = null;
    notify();
  }, 1800);
}

export function useToastMessage(): string | null {
  const [message, setMessage] = useState(current);
  useEffect(() => {
    listeners.add(setMessage);
    return () => {
      listeners.delete(setMessage);
    };
  }, []);
  return message;
}
