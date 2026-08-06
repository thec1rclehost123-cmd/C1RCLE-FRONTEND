'use client';

import { GlobalShell } from './layout/GlobalShell';

import type { ReactNode } from 'react';


export function AppShell({ children }: { readonly children: ReactNode }) {
  return <GlobalShell>{children}</GlobalShell>;
}
