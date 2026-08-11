import { AppProviders, themeInitScript } from '@c1rcle/providers';

import { DashboardAuthProvider } from '@/components/providers/DashboardAuthProvider';

import './globals.css';
import '@/components/partner-shell/partner-shell.css';
import '@/components/partner-shell/dashboard-ui.css';

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
    <html lang="en" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/*
          Applies the stored theme before first paint so the page never
          flashes the wrong colour scheme. Content is a build-time constant
          from @c1rcle/providers — no user input reaches it.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased bg-[#0A0A0B] text-white">
        <AppProviders>
          <DashboardAuthProvider>{children}</DashboardAuthProvider>
        </AppProviders>
      </body>
    </html>
  );
}
