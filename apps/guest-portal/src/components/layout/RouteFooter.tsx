'use client';

import { usePathname } from 'next/navigation';

import type { ReactNode } from 'react';

export function RouteFooter({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return children;
}
