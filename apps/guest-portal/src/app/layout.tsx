import { AppShell } from '@/components/app-shell';

import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL('https://thec1rcle.com'),
  title: {
    default: 'C1RCLE Guest Portal',
    template: '%s · Guest',
  },
  description: 'Discover, book and manage your C1RCLE experiences.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-black text-white antialiased">
        <a
          href="#main"
          className="sr-only-focusable absolute left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Skip to content
        </a>

        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
