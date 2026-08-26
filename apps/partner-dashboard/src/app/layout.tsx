import { Archivo, Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';

import './globals.css';
import '@/styles/partner-v3.css';

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

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${displayFont.variable} ${bodyFont.variable} ${partnerV3Font.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="antialiased bg-[#0A0A0B] text-white">{children}</body>
    </html>
  );
}
