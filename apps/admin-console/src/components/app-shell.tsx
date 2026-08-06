'use client';

import { DarkModeIcon, LightModeIcon } from '@c1rcle/icons';
import { useTheme } from '@c1rcle/providers';
import { Button } from '@c1rcle/ui';

import { NAV_ITEMS, APP_TITLE } from '@/lib/app-meta';

import type { ReactNode } from 'react';

export function AppShell({ children }: { readonly children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">{APP_TITLE}</span>

          <nav aria-label="Primary" className="flex-1">
            <ul className="flex items-center gap-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="rounded-sm text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTheme(isDark ? 'light' : 'dark');
            }}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <LightModeIcon className="size-4" /> : <DarkModeIcon className="size-4" />}
          </Button>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          {APP_TITLE}
        </div>
      </footer>
    </div>
  );
}
