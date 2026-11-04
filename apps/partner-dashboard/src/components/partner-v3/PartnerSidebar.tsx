import Link from 'next/link';

import {
  AnnouncementIcon,
  BankIcon,
  CalendarIcon,
  DashboardIcon,
  GuestIcon,
  GuestPortalIcon,
  ForwardIcon,
  PendingIcon,
  PartnerIcon,
  SettingsIcon,
  SupportIcon,
  TrendUpIcon,
} from '@c1rcle/icons';

import styles from './partner-v3.module.css';

import { IconButton } from './index';

import type { StudioConfig, StudioIconName } from '@/studios/studio-config';

const ICONS = {
  dashboard: DashboardIcon,
  events: CalendarIcon,
  requests: PendingIcon,
  partners: PartnerIcon,
  marketing: AnnouncementIcon,
  presence: GuestPortalIcon,
  finance: BankIcon,
  guests: GuestIcon,
  analytics: TrendUpIcon,
  leaderboard: TrendUpIcon,
  support: SupportIcon,
  settings: SettingsIcon,
} satisfies Record<StudioIconName, typeof DashboardIcon>;

export function PartnerSidebar({
  config,
  pathname,
  onLayoutToggle,
}: {
  readonly config: StudioConfig;
  readonly pathname: string;
  readonly onLayoutToggle: () => void;
}) {
  return (
    <aside className={styles['sidebar']} aria-label={`${config.label} navigation`}>
      <div className={styles['brandBlock']}>
        <span className={styles['brandMark']} aria-hidden="true">
          <i />
        </span>
        <span className={styles['brandText']}>
          <strong>THE C1RCLE</strong>
          <small>{config.label}</small>
        </span>
        <IconButton
          label="Use top navigation"
          className={styles['layoutSwitchButton']}
          aria-pressed="false"
          onClick={onLayoutToggle}
        >
          <ForwardIcon size={20} aria-hidden="true" />
        </IconButton>
      </div>
      <nav className={styles['sidebarNav']}>
        {config.navigation.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[styles['navItem'], active ? styles['navItemActive'] : '']
                .filter(Boolean)
                .join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
