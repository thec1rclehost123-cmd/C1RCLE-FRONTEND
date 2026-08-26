import { AccountIcon, MenuIcon } from '@c1rcle/icons';

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
  mobileOpen,
  onMobileToggle,
  onSignOut,
}: {
  readonly config: StudioConfig;
  readonly activeLabel: string;
  readonly userName: string;
  readonly searchData: PartnerSearchData;
  readonly notificationsData: PartnerNotificationsData;
  readonly mobileOpen: boolean;
  readonly onMobileToggle: () => void;
  readonly onSignOut: () => void;
}) {
  return (
    <header className={styles['topbar']}>
      <IconButton label="Open navigation" className={styles['mobileMenuButton']} aria-expanded={mobileOpen} onClick={onMobileToggle}>
        <MenuIcon size={18} aria-hidden="true" />
      </IconButton>
      <div className={styles['topbarIdentity']}>
        <span>{activeLabel}</span>
        <small>{config.label}</small>
      </div>
      <div className={styles['topbarActions']}>
        <PartnerGlobalSearch data={searchData} />
        <PartnerNotifications data={notificationsData} />
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
