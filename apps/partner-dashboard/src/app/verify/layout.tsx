import { DashboardAuthProvider } from '@/components/providers/DashboardAuthProvider';

import type { ReactNode } from 'react';

export default function VerifyLayout({ children }: { readonly children: ReactNode }) {
  return <DashboardAuthProvider>{children}</DashboardAuthProvider>;
}
