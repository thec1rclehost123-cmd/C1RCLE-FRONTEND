'use client';

import { usePathname, useRouter } from 'next/navigation';

import { logout, useSession } from '@c1rcle/auth';
import { DarkModeIcon, LightModeIcon } from '@c1rcle/icons';
import { useTheme } from '@c1rcle/providers';
import { Button } from '@c1rcle/ui';

import { NAV_ITEMS, APP_TITLE } from '@/lib/app-meta';

import type { ReactNode } from 'react';

const HIDE_SHELL_PATHS = new Set(['/login']);

export function AppShell({ children }: { readonly children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();

  const hideChrome = HIDE_SHELL_PATHS.has(pathname);

  return (
    <div className="flex min-h-dvh flex-col">
      {hideChrome ? (
        <>{children}</>
      ) : (
        <>
          <header className="border-b border-border">
            <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4">
              <span className="text-sm font-semibold tracking-tight">{APP_TITLE}</span>

              <nav aria-label="Primary" className="flex-1">
                <ul className="flex items-center gap-4">
                  {NAV_ITEMS.map((item) => {
                    const isActive =
                      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          aria-current={isActive ? 'page' : undefined}
                          className={`rounded-sm text-sm ${
                            isActive
                              ? 'font-medium text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="flex items-center gap-2">
                {user === null ? null : (
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {user.email}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void logout().then(() => { router.replace('/login'); });
                  }}
                >
                  Sign out
                </Button>
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
            </div>
          </header>

          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
            {children}
          </main>

          <footer className="border-t border-border">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
              <span>{APP_TITLE}</span>
              <span>Restricted · every action is audited</span>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}