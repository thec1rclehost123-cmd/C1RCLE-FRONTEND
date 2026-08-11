'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  AnnouncementIcon,
  BackIcon,
  BankIcon,
  CalendarIcon,
  CloseIcon,
  DashboardIcon,
  ForwardIcon,
  LinkIcon,
  MenuIcon,
  NotificationIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { PARTNER_SHELL_CONFIG } from './config';

import type { PartnerDashboardLayoutProps, PartnerNavigationItem } from './types';
import type { IconProps } from '@c1rcle/icons';
import type { ComponentType } from 'react';

const ICONS: Readonly<Record<string, ComponentType<IconProps>>> = {
  'calendar-days': CalendarIcon,
  'layout-dashboard': DashboardIcon,
  link: LinkIcon,
  send: AnnouncementIcon,
  settings: SettingsIcon,
  users: UsersIcon,
  'wallet-cards': BankIcon,
};

const VenueNotificationDrawer = dynamic(() =>
  import('./VenueNotificationDrawer').then((module) => module.VenueNotificationDrawer),
);
const ShellSignOutDialog = dynamic(() =>
  import('./ShellSignOutDialog').then((module) => module.ShellSignOutDialog),
);

const initialsFrom = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'C1';

const isActiveRoute = (pathname: string, item: PartnerNavigationItem): boolean =>
  item.match === 'prefix' ? pathname.startsWith(item.href) : pathname === item.href;

function AuthorizationSplash({ label }: { readonly label: string }) {
  return (
    <div className="partner-auth-splash" role="status" aria-live="polite">
      <span className="partner-auth-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function PartnerDashboardLayout({ partnerRole, children }: PartnerDashboardLayoutProps) {
  const auth = useDashboardAuth();
  const router = useRouter();
  const pathname = usePathname();
  const config = PARTNER_SHELL_CONFIG[partnerRole];
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const mobileOpenRef = useRef(false);

  const closeTransientUi = () => {
    mobileOpenRef.current = false;
    setMobileOpen(false);
    setSearchOpen(false);
    setNotificationsOpen(false);
    setAccountOpen(false);
    setSignOutOpen(false);
  };

  const closeMobileNavigation = () => {
    mobileOpenRef.current = false;
    setMobileOpen(false);
    window.setTimeout(() => mobileMenuRef.current?.focus(), 0);
  };

  const membership = auth.profile?.activeMembership ?? null;
  const activeRole = membership?.partnerType === 'club' ? 'venue' : membership?.partnerType;
  const user: unknown = auth.user;

  useEffect(() => {
    if (auth.loading) return;
    if (!user || auth.isBanned) {
      router.replace('/login');
      return;
    }
    if (!auth.isApproved) {
      router.replace('/onboard');
      return;
    }
    if (activeRole && activeRole !== partnerRole) {
      const storedRoute = membership?.partnerId
        ? window.localStorage.getItem(`partner:last-route:${membership.partnerId}`)
        : null;
      router.replace(
        storedRoute?.startsWith(`/${activeRole}`) ? storedRoute : `/${activeRole}/overview`,
      );
    }
  }, [
    activeRole,
    auth.isApproved,
    auth.isBanned,
    auth.loading,
    membership?.partnerId,
    partnerRole,
    router,
    user,
  ]);

  useEffect(() => {
    if (membership?.partnerId && pathname.startsWith(`/${partnerRole}`)) {
      window.localStorage.setItem(`partner:last-route:${membership.partnerId}`, pathname);
    }
  }, [membership?.partnerId, partnerRole, pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (event.key === 'Escape') {
        const restoreMobileMenuFocus = mobileOpenRef.current;
        closeTransientUi();
        if (restoreMobileMenuFocus) window.setTimeout(() => mobileMenuRef.current?.focus(), 0);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) closeTransientUi();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const visibleNavigation = useMemo(
    () =>
      config.navigation.filter((item) => {
        const tabKey = item.label.toLowerCase().replace(/\s+/g, '-');
        if (auth.tabVisibility?.[tabKey] === false || auth.tabVisibility?.[item.label] === false)
          return false;
        if (
          item.permission &&
          auth.grantedPermissions.length > 0 &&
          !auth.grantedPermissions.includes(item.permission)
        )
          return false;
        return true;
      }),
    [auth.grantedPermissions, auth.tabVisibility, config.navigation],
  );

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return visibleNavigation;
    return visibleNavigation.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [query, visibleNavigation]);

  if (auth.loading) return <AuthorizationSplash label="Authorizing access" />;
  if (!user || auth.isBanned || !auth.isApproved || (activeRole && activeRole !== partnerRole)) {
    return <AuthorizationSplash label="Redirecting" />;
  }

  const displayName = membership?.partnerName ?? auth.profile?.displayName ?? config.eyebrow;
  const identityInitials = initialsFrom(displayName);
  const avatarInitials = partnerRole === 'venue' ? 'VP' : identityInitials;
  const activeNavigation =
    visibleNavigation.find((item) => isActiveRoute(pathname, item)) ?? visibleNavigation[0];
  const pageIdentity = activeNavigation?.label ?? config.eyebrow;

  return (
    <div
      ref={shellRef}
      className="partner-dashboard partner-dashboard-shell-v2"
      data-partner-role={partnerRole}
      data-sidebar-collapsed={collapsed ? 'true' : 'false'}
    >
      <a className="partner-skip-link" href="#partner-dashboard-content">
        Skip to dashboard content
      </a>

      <button
        type="button"
        className={`partner-sidebar-backdrop${mobileOpen ? ' is-open' : ''}`}
        aria-label="Close navigation"
        onClick={closeMobileNavigation}
      />

      <aside
        className={`partner-sidebar${mobileOpen ? ' is-open' : ''}`}
        aria-label={`${config.eyebrow} navigation`}
      >
        <Link
          href={`/${partnerRole}/overview`}
          className="partner-sidebar-brand"
          aria-label="THE C1RCLE dashboard home"
          onClick={closeTransientUi}
        >
          <span className="partner-sidebar-wordmark">
            THE <b>C1</b>RCLE
          </span>
          <small>{config.eyebrow}</small>
          <span className="partner-sidebar-monogram" aria-hidden="true">
            C1
          </span>
        </Link>

        <button
          type="button"
          className="partner-sidebar-mobile-close"
          aria-label="Close navigation"
          onClick={closeMobileNavigation}
        >
          <CloseIcon size={20} aria-hidden="true" />
        </button>

        <nav className="partner-sidebar-nav">
          {visibleNavigation.map((item) => {
            const NavIcon = ICONS[item.icon] ?? DashboardIcon;
            const active = isActiveRoute(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'is-active' : undefined}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                onClick={closeTransientUi}
              >
                <NavIcon size={20} strokeWidth={1.7} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="partner-sidebar-collapse"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => {
            setCollapsed((value) => !value);
          }}
        >
          {collapsed ? (
            <ForwardIcon size={19} aria-hidden="true" />
          ) : (
            <BackIcon size={19} aria-hidden="true" />
          )}
          <span>{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </aside>

      <div className="partner-workspace">
        <header className="partner-topbar">
          <div className="partner-breadcrumb">
            <button
              ref={mobileMenuRef}
              type="button"
              className="partner-mobile-menu-button"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => {
                mobileOpenRef.current = true;
                setMobileOpen(true);
              }}
            >
              <MenuIcon size={21} aria-hidden="true" />
            </button>
            <span className="partner-breadcrumb-home" aria-hidden="true">
              ⌂
            </span>
            <span aria-hidden="true">/</span>
            <strong>{pageIdentity}</strong>
          </div>

          <div className="partner-command-search">
            <SearchIcon size={18} strokeWidth={1.7} aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              onFocus={() => {
                setSearchOpen(true);
              }}
              placeholder="Search events, partners, invoices..."
              aria-label="Search dashboard"
            />
            <kbd>⌘ K</kbd>
            {searchOpen ? (
              <div className="partner-search-results" role="listbox" aria-label="Dashboard pages">
                <small>Quick navigation</small>
                {searchResults.map((item) => (
                  <Link key={item.href} href={item.href} onClick={closeTransientUi}>
                    <span>{item.label}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
                {searchResults.length === 0 ? <p>No matching dashboard pages.</p> : null}
              </div>
            ) : null}
          </div>

          <div className="partner-topbar-actions">
            <button
              type="button"
              className="partner-mobile-search-button"
              aria-label="Search dashboard"
              onClick={() => {
                setSearchOpen(true);
                window.setTimeout(() => searchRef.current?.focus(), 0);
              }}
            >
              <SearchIcon size={19} aria-hidden="true" />
            </button>
            <button
              ref={notificationButtonRef}
              type="button"
              className="partner-notification-button"
              aria-label="Notifications, 3 unread"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setAccountOpen(false);
              }}
            >
              <NotificationIcon size={20} strokeWidth={1.7} aria-hidden="true" />
              <span>3</span>
            </button>
            <Link href={config.primaryAction.href} className="partner-primary-action">
              {config.primaryAction.label}
            </Link>
            <button
              ref={accountButtonRef}
              type="button"
              className="partner-account-button"
              title={displayName}
              aria-label="Open account menu"
              aria-expanded={accountOpen}
              onClick={() => {
                setAccountOpen((open) => !open);
                setNotificationsOpen(false);
              }}
            >
              {avatarInitials}
            </button>
            <span className="partner-account-chevron" aria-hidden="true">
              ⌄
            </span>
          </div>

          <VenueNotificationDrawer
            open={notificationsOpen}
            role={partnerRole}
            onClose={() => {
              setNotificationsOpen(false);
            }}
            trigger={notificationButtonRef}
          />

          {accountOpen ? (
            <div
              className="partner-popover partner-account-popover"
              role="dialog"
              aria-label="Account menu"
            >
              <div className="partner-account-identity">
                <span>{identityInitials}</span>
                <div>
                  <strong>{displayName}</strong>
                  <small>
                    {membership?.role ?? 'owner'} · {partnerRole}
                  </small>
                </div>
              </div>
              <Link href={`/${partnerRole}/settings`} onClick={closeTransientUi}>
                Profile & settings
              </Link>
              {auth.memberships.length > 1 ? (
                <Link href="/partner/select-organization" onClick={closeTransientUi}>
                  Switch organization
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  setSignOutOpen(true);
                }}
              >
                Sign out
              </button>
            </div>
          ) : null}
          {signOutOpen ? (
            <ShellSignOutDialog
              label={config.eyebrow}
              trigger={accountButtonRef}
              onClose={() => {
                setSignOutOpen(false);
              }}
              onConfirm={() => {
                void auth.signOut();
              }}
            />
          ) : null}
        </header>

        <main id="partner-dashboard-content" className="partner-dashboard-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
