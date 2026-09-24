'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import { getStudioConfig, type StudioRole } from '@/studios/studio-config';

import { MobileNavigation } from './MobileNavigation';
import styles from './partner-v3.module.css';
import { PartnerSidebar } from './PartnerSidebar';
import { PartnerTopbar } from './PartnerTopbar';

import type { PartnerShellInteractionData } from '@/data/partner-data-source';

type PartnerNavigationLayout = 'side' | 'top';

const NAVIGATION_LAYOUT_STORAGE_KEY = 'c1rcle.partner.navigation-layout';
const NAVIGATION_LAYOUT_CHANGE_EVENT = 'partner-navigation-layout-change';

const getStoredNavigationLayout = (): PartnerNavigationLayout => {
  const savedLayout = window.localStorage.getItem(NAVIGATION_LAYOUT_STORAGE_KEY);
  return savedLayout === 'top' ? 'top' : 'side';
};

const subscribeToNavigationLayout = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(NAVIGATION_LAYOUT_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(NAVIGATION_LAYOUT_CHANGE_EVENT, onStoreChange);
  };
};

const getServerNavigationLayout = (): PartnerNavigationLayout => 'side';

export function PartnerShell({
  studio,
  interactionData,
  children,
}: {
  readonly studio: StudioRole;
  readonly interactionData: PartnerShellInteractionData;
  readonly children: ReactNode;
}) {
  const config = getStudioConfig(studio);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useDashboardAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigationLayout = useSyncExternalStore(
    subscribeToNavigationLayout,
    getStoredNavigationLayout,
    getServerNavigationLayout,
  );
  const userName = auth.profile?.displayName ?? 'Partner';
  const appClass = styles['app'] ?? '';
  const activeLabel =
    config.navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      ?.label ?? config.label;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const signOut = async () => {
    await auth.signOut();
    router.replace('/login');
  };

  const toggleNavigationLayout = () => {
    const nextLayout = navigationLayout === 'side' ? 'top' : 'side';
    window.localStorage.setItem(NAVIGATION_LAYOUT_STORAGE_KEY, nextLayout);
    window.dispatchEvent(new Event(NAVIGATION_LAYOUT_CHANGE_EVENT));
  };

  return (
    <div
      className={[
        appClass,
        navigationLayout === 'top' ? styles['appTopNavigation'] : '',
        'partner-v3-app',
      ]
        .filter(Boolean)
        .join(' ')}
      data-navigation-layout={navigationLayout}
    >
      {navigationLayout === 'side' ? (
        <PartnerSidebar
          config={config}
          pathname={pathname}
          onLayoutToggle={toggleNavigationLayout}
        />
      ) : null}
      <div className={styles['main']}>
        <PartnerTopbar
          config={config}
          activeLabel={activeLabel}
          userName={userName}
          searchData={interactionData.search}
          notificationsData={interactionData.notifications}
          navigationLayout={navigationLayout}
          mobileOpen={mobileOpen}
          onMobileToggle={() => {
            setMobileOpen((value) => !value);
          }}
          onLayoutToggle={toggleNavigationLayout}
          onSignOut={() => void signOut()}
        />
        <main className={styles['content']}>{children}</main>
      </div>
      <MobileNavigation
        config={config}
        pathname={pathname}
        open={mobileOpen}
        onClose={() => {
          setMobileOpen(false);
        }}
      />
    </div>
  );
}
