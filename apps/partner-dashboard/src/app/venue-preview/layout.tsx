import { Archivo } from 'next/font/google';

import '../venue/venue.css';

import type { ReactNode } from 'react';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-archivo',
});

export default function VenuePreviewLayout({ children }: { readonly children: ReactNode }) {
  return <div className={archivo.variable}>{children}</div>;
}
