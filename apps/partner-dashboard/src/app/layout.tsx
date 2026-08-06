import { AppProviders, themeInitScript } from '@c1rcle/providers';

import { AppShell } from '@/components/app-shell';

import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'C1RCLE Partner Dashboard',
    template: '%s · Partner',
  },
  description: 'Manage your venues, availability and bookings.',
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

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Applies the stored theme before first paint so the page never
          flashes the wrong colour scheme. Content is a build-time constant
          from @c1rcle/providers — no user input reaches it.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only-focusable absolute left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Skip to content
        </a>

        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
