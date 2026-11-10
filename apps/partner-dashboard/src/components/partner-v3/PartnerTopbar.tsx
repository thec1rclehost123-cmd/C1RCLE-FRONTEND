import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { AccountIcon, BackIcon, CalendarIcon, MenuIcon } from '@c1rcle/icons';

import { ConnectedPartnerNotifications } from './ConnectedPartnerNotifications';
import styles from './partner-v3.module.css';
import { PartnerGlobalSearch } from './PartnerGlobalSearch';

import { Avatar, IconButton } from './index';

import type { StudioConfig, StudioRole  } from '@/studios/studio-config';

export function PartnerTopbar({
  config,
  activeLabel,
  settingsHref,
  userName,
  studio,
  organizationId,
  navigationLayout,
  mobileOpen,
  onMobileToggle,
  onLayoutToggle,
  onSignOut,
}: {
  readonly config: StudioConfig;
  readonly activeLabel: string;
  readonly settingsHref: string | undefined;
  readonly userName: string;
  readonly studio: StudioRole;
  readonly organizationId: string | null;
  readonly navigationLayout: 'side' | 'top';
  readonly mobileOpen: boolean;
  readonly onMobileToggle: () => void;
  readonly onLayoutToggle: () => void;
  readonly onSignOut: () => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountMenuOpen]);

  return (
    <header
      className={[styles['topbar'], navigationLayout === 'top' ? styles['topbarTopNavigation'] : '']
        .filter(Boolean)
        .join(' ')}
    >
      <IconButton
        label="Open navigation"
        className={styles['mobileMenuButton']}
        aria-expanded={mobileOpen}
        onClick={onMobileToggle}
      >
        <MenuIcon size={18} aria-hidden="true" />
      </IconButton>
      {navigationLayout === 'top' ? (
        <>
          <div className={styles['topbarBrand']}>
            <span className={styles['brandMark']} aria-hidden="true">
              <i />
            </span>
            <span className={styles['brandText']}>
              <strong>THE C1RCLE</strong>
              <small>{config.label}</small>
            </span>
            <IconButton
              label="Use side navigation"
              className={styles['layoutSwitchButton']}
              aria-pressed="true"
              onClick={onLayoutToggle}
            >
              <BackIcon size={20} aria-hidden="true" />
            </IconButton>
          </div>
          <nav className={styles['topNavigation']} aria-label={`${config.label} navigation`}>
            <div className={styles['topNavigationList']}>
              {config.navigation.map((item) => {
                const active = item.label === activeLabel;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      styles['topNavigationItem'],
                      active ? styles['topNavigationItemActive'] : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div
            className={[styles['topbarIdentity'], styles['topModeMobileIdentity']]
              .filter(Boolean)
              .join(' ')}
          >
            <span>{config.label}</span>
          </div>
        </>
      ) : (
        <div className={styles['topbarIdentity']}>
          <span>{config.label}</span>
        </div>
      )}
      <div className={styles['topbarActions']}>
        <PartnerGlobalSearch organizationId={organizationId} studio={studio} />
        <ConnectedPartnerNotifications organizationId={organizationId} studioRole={config.role} />
        {config.role !== 'promoter' ? (
          <Link
            href={`/partner/${config.role}/calendar`}
            className={styles['iconButton']}
            aria-label="Open calendar"
            title="Calendar"
          >
            <CalendarIcon size={18} aria-hidden="true" />
          </Link>
        ) : null}
        <div className={styles['accountMenu']} ref={accountMenuRef}>
          <button
            type="button"
            className={styles['accountTrigger']}
            aria-label={`Account options for ${userName}`}
            aria-expanded={accountMenuOpen}
            aria-controls="partner-account-options"
            onClick={() => {
              setAccountMenuOpen((open) => !open);
            }}
          >
            <Avatar name={userName} size="small" />
            <span className={styles['accountName']}>{userName}</span>
          </button>
          {accountMenuOpen ? (
            <div className={styles['accountPopover']} id="partner-account-options">
              <div className={styles['accountPopoverIdentity']}>
                <strong>{userName}</strong>
                <span>{config.label}</span>
              </div>
              {settingsHref ? (
                <Link
                  className={styles['accountSettings']}
                  href={settingsHref}
                  onClick={() => {
                    setAccountMenuOpen(false);
                  }}
                >
                  Settings
                </Link>
              ) : null}
              <button
                type="button"
                className={[styles['accountAction'], styles['accountSignOut']].join(' ')}
                onClick={() => {
                  setAccountMenuOpen(false);
                  onSignOut();
                }}
              >
                <AccountIcon size={15} aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
