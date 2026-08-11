import { Archivo } from 'next/font/google';

import '../promoter/promoter.css';

import type { ReactNode } from 'react';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-archivo',
});

export default function PartnerNetworkLayout({ children }: { readonly children: ReactNode }) {
  return <div className={archivo.variable}>{children}</div>;
}
