'use client';

import { QueryProvider } from './query-provider.js';
import { ThemeProvider } from './theme-provider.js';

import type { ReactNode } from 'react';

export interface AppProvidersProps {
  readonly children: ReactNode;
}

/**
 * The single provider tree every application mounts at its root layout.
 *
 * Keeping the composition here — rather than in each app's layout — means a
 * new cross-cutting provider is added once, not three times.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
