'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import { getStudioConfig, type StudioRole } from '@/studios/studio-config';

import { MobileNavigation } from './MobileNavigation';
import styles from './partner-v3.module.css';
import { PartnerSidebar } from './PartnerSidebar';
import { PartnerTopbar } from './PartnerTopbar';

import type { PartnerShellInteractionData } from '@/data/partner-data-source';

export function PartnerShell({ studio, interactionData, children }: { readonly studio: StudioRole; readonly interactionData: PartnerShellInteractionData; readonly children: ReactNode }) {
  const config = getStudioConfig(studio);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useDashboardAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userName = auth.profile?.displayName ?? 'Partner';
  const appClass = styles['app'] ?? '';
  const activeLabel = config.navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? config.label;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); };
  }, []);

  const signOut = async () => {
    await auth.signOut();
    router.replace('/login');
  };

  return (
    <div className={`${appClass} partner-v3-app`}>
      <PartnerSidebar config={config} pathname={pathname} />
      <div className={styles['main']}>
        <PartnerTopbar
          config={config}
          activeLabel={activeLabel}
          userName={userName}
          searchData={interactionData.search}
          notificationsData={interactionData.notifications}
          mobileOpen={mobileOpen}
          onMobileToggle={() => { setMobileOpen((value) => !value); }}
          onSignOut={() => void signOut()}
        />
        <main className={styles['content']}>{children}</main>
      </div>
      <MobileNavigation config={config} pathname={pathname} open={mobileOpen} onClose={() => { setMobileOpen(false); }} />
    </div>
  );
}
