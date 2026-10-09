import { cookies } from 'next/headers';

import { getServerSession } from '@c1rcle/auth/server-session';

import { DashboardAuthProvider } from '@/components/providers/DashboardAuthProvider';
import { PasswordChangeGuard } from '@/components/providers/PasswordChangeGuard';
import { SessionProvider } from '@/components/providers/session-provider';

import './globals.css';
import '@/styles/partner-v3.css';

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

export default async function RootLayout({ children }: { readonly children: ReactNode }) {
  const session = await getServerSession((await cookies()).toString());

  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased bg-[#0A0A0B] text-white">
        <SessionProvider initialUser={session}>
          <DashboardAuthProvider>
            <PasswordChangeGuard>{children}</PasswordChangeGuard>
          </DashboardAuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
