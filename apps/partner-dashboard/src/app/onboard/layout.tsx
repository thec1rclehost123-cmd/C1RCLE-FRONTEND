import { DashboardAuthProvider } from '@/components/providers/DashboardAuthProvider';

import type { ReactNode } from 'react';

export default function OnboardLayout({ children }: { readonly children: ReactNode }) {
  return <DashboardAuthProvider>{children}</DashboardAuthProvider>;
}
