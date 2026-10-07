import { cookies } from 'next/headers';

import { getServerSession } from '@c1rcle/auth/server-session';
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from '@c1rcle/design-system';
import { AppProviders } from '@c1rcle/providers';

import { AppShell } from '@/components/app-shell';
import { SessionProvider } from '@/components/providers/session-provider';

import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'C1RCLE Admin Console',
    template: '%s · Admin',
  },
  description: 'Platform operations, users and oversight.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

/**
 * Admin console defaults first-time visitors to dark — a control-room desk
 * for ops/finance/support, not a public-facing light SaaS panel. Persists
 * the choice through the same `@c1rcle/providers` theme store the toggle
 * button uses, so a first visit is indistinguishable from someone who
 * explicitly picked dark; the toggle still fully overrides it afterwards.
 * Runs synchronously in <head>, same constraint as the shared
 * `themeInitScript` this replaces (only for this app).
 */
const adminThemeInitScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var a='${THEME_ATTRIBUTE}';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t='dark';localStorage.setItem(k,t);}document.documentElement.setAttribute(a,t);}catch(e){document.documentElement.setAttribute('${THEME_ATTRIBUTE}','dark');}})();`;

export default async function RootLayout({ children }: { readonly children: ReactNode }) {
  const session = await getServerSession((await cookies()).toString());

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Applies the stored (or newly-seeded dark-default) theme before
          first paint so the page never flashes the wrong colour scheme.
        */}
        <script dangerouslySetInnerHTML={{ __html: adminThemeInitScript }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only-focusable absolute left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Skip to content
        </a>

        <SessionProvider initialUser={session}>
          <AppProviders>
            <AppShell initialUser={session}>{children}</AppShell>
          </AppProviders>
        </SessionProvider>
      </body>
    </html>
  );
}
