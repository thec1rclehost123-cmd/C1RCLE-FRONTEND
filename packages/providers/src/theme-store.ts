import { THEME_ATTRIBUTE, THEME_STORAGE_KEY, type Theme } from '@c1rcle/design-system';

/**
 * The theme lives in localStorage and on the <html> element, not in React
 * state — the pre-paint init script has to be able to read and apply it
 * before React exists.
 *
 * This is a minimal external store so components can subscribe with
 * `useSyncExternalStore`, which lets React reconcile the server snapshot
 * ('system') with the client snapshot during hydration instead of forcing a
 * second render from an effect.
 */

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function getThemeSnapshot(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    /* Storage can be unavailable in private browsing or a sandboxed frame. */
    return 'system';
  }
}

/** The server cannot know the user's choice, so it always renders 'system'. */
export function getThemeServerSnapshot(): Theme {
  return 'system';
}

export function writeTheme(theme: Theme): void {
  const root = document.documentElement;

  if (theme === 'system') {
    root.removeAttribute(THEME_ATTRIBUTE);
  } else {
    root.setAttribute(THEME_ATTRIBUTE, theme);
  }

  try {
    if (theme === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    /* A failed write only costs persistence, not correctness this session. */
  }

  emit();
}

/**
 * Applies the stored theme before first paint.
 *
 * Without it the page renders in the default theme and then flips, which is
 * both jarring and a WCAG 2.3 flash risk. It must run synchronously in
 * <head>, which is the one legitimate inline script in this repository.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark'){document.documentElement.setAttribute('${THEME_ATTRIBUTE}',t);}}catch(e){}})();`;
