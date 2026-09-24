import { Archivo, Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';
import { cookies } from 'next/headers';

import './globals.css';
import '@/styles/partner-v3.css';

import { getServerSession } from '@c1rcle/auth/server-session';

import { DashboardAuthProvider } from '@/components/providers/DashboardAuthProvider';
import { SessionProvider } from '@/components/providers/session-provider';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

const partnerV3Font = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-partner-v3',
  display: 'swap',
});

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
    <html
      lang="en"
      className={`dark ${displayFont.variable} ${bodyFont.variable} ${partnerV3Font.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="antialiased bg-[#0A0A0B] text-white">
        <SessionProvider initialUser={session}>
          <DashboardAuthProvider>{children}</DashboardAuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
