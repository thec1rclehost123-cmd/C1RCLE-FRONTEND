'use client';

import { createContext, use, useCallback, useMemo, useSyncExternalStore } from 'react';

import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  subscribeToTheme,
  writeTheme,
} from './theme-store.js';

import type { Theme } from '@c1rcle/design-system';
import type { ReactNode } from 'react';

interface ThemeContextValue {
  readonly theme: Theme;
  readonly setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  readonly children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getThemeServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    writeTheme(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext);

  if (context === null) {
    throw new Error('useTheme() must be used inside <AppProviders>.');
  }

  return context;
}
