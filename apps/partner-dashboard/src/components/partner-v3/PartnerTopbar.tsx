import Link from 'next/link';

import { AccountIcon, MenuIcon, NavigationSideIcon, NavigationTopIcon } from '@c1rcle/icons';

import styles from './partner-v3.module.css';
import { PartnerGlobalSearch } from './PartnerGlobalSearch';
import { PartnerNotifications } from './PartnerNotifications';

import { Avatar, IconButton } from './index';


import type { PartnerNotificationsData, PartnerSearchData } from '@/data/partner-data-source';
import type { StudioConfig } from '@/studios/studio-config';


export function PartnerTopbar({
  config,
  activeLabel,
  userName,
  searchData,
  notificationsData,
  navigationLayout,
  mobileOpen,
  onMobileToggle,
  onLayoutToggle,
  onSignOut,
}: {
  readonly config: StudioConfig;
  readonly activeLabel: string;
  readonly userName: string;
  readonly searchData: PartnerSearchData;
  readonly notificationsData: PartnerNotificationsData;
  readonly navigationLayout: 'side' | 'top';
  readonly mobileOpen: boolean;
  readonly onMobileToggle: () => void;
  readonly onLayoutToggle: () => void;
  readonly onSignOut: () => void;
}) {
  return (
    <header className={[styles['topbar'], navigationLayout === 'top' ? styles['topbarTopNavigation'] : ''].filter(Boolean).join(' ')}>
      <IconButton label="Open navigation" className={styles['mobileMenuButton']} aria-expanded={mobileOpen} onClick={onMobileToggle}>
        <MenuIcon size={18} aria-hidden="true" />
      </IconButton>
      {navigationLayout === 'top' ? (
        <>
          <div className={styles['topbarBrand']}>
            <span className={styles['brandMark']} aria-hidden="true"><i /></span>
            <span className={styles['brandText']}>
              <strong>THE C1RCLE</strong>
              <small>{config.label}</small>
            </span>
          </div>
          <nav className={styles['topNavigation']} aria-label={`${config.label} navigation`}>
            <div className={styles['topNavigationList']}>
              {config.navigation.map((item) => {
                const active = item.label === activeLabel;
                return (
                  <Link key={item.href} href={item.href} className={[styles['topNavigationItem'], active ? styles['topNavigationItemActive'] : ''].filter(Boolean).join(' ')} aria-current={active ? 'page' : undefined}>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className={[styles['topbarIdentity'], styles['topModeMobileIdentity']].filter(Boolean).join(' ')}>
            <span>{activeLabel}</span>
            <small>{config.label}</small>
          </div>
        </>
      ) : (
        <div className={styles['topbarIdentity']}>
          <span>{activeLabel}</span>
          <small>{config.label}</small>
        </div>
      )}
      <div className={styles['topbarActions']}>
        <PartnerGlobalSearch data={searchData} />
        <PartnerNotifications data={notificationsData} />
        <IconButton
          label={navigationLayout === 'side' ? 'Use top navigation' : 'Use side navigation'}
          className={styles['layoutSwitchButton']}
          aria-pressed={navigationLayout === 'top'}
          onClick={onLayoutToggle}
        >
          {navigationLayout === 'side' ? <NavigationTopIcon size={17} aria-hidden="true" /> : <NavigationSideIcon size={17} aria-hidden="true" />}
        </IconButton>
        <div className={styles['accountMenu']}>
          <Avatar name={userName} size="small" />
          <span className={styles['accountName']}>{userName}</span>
          <button type="button" className={styles['accountAction']} onClick={onSignOut}>
            <AccountIcon size={15} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
