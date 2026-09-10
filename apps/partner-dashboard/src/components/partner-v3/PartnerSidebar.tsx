import Link from 'next/link';

import {
  AnnouncementIcon,
  BankIcon,
  CalendarIcon,
  DashboardIcon,
  GuestIcon,
  PendingIcon,
  PartnerIcon,
  NavigationTopIcon,
  SettingsIcon,
  TrendUpIcon,
} from '@c1rcle/icons';

import styles from './partner-v3.module.css';

import type { StudioConfig, StudioIconName } from '@/studios/studio-config';

const ICONS = {
  dashboard: DashboardIcon,
  events: CalendarIcon,
  requests: PendingIcon,
  partners: PartnerIcon,
  marketing: AnnouncementIcon,
  finance: BankIcon,
  guests: GuestIcon,
  analytics: TrendUpIcon,
  leaderboard: TrendUpIcon,
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
              <Icon size={17} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className={styles['sidebarFooter']}>
        <button type="button" className={styles['sidebarLayoutSwitch']} onClick={onLayoutToggle}>
          <NavigationTopIcon size={16} aria-hidden="true" />
          <span>Top navigation</span>
        </button>
        <span className={styles['fixtureLabel']}>FOUNDATION</span>
        <span className={styles['sidebarNote']}>V3 shell · read-only routes</span>
      </div>
    </aside>
  );
}
