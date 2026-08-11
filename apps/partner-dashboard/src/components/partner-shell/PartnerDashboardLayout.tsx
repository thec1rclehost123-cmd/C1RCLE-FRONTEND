'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { PARTNER_SHELL_CONFIG } from './config';

import type { PartnerDashboardLayoutProps, PartnerNavigationItem } from './types';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const closeTransientUi = () => {
    setMobileOpen(false);
    setSearchOpen(false);
    setNotificationsOpen(false);
    setAccountOpen(false);
    setOrganizationOpen(false);
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
      const storedRoute = membership?.partnerId ? window.localStorage.getItem(`partner:last-route:${membership.partnerId}`) : null;
      router.replace(storedRoute?.startsWith(`/${activeRole}`) ? storedRoute : `/${activeRole}/overview`);
    }
  }, [activeRole, auth.isApproved, auth.isBanned, auth.loading, membership?.partnerId, partnerRole, router, user]);

  useEffect(() => {
    if (membership?.partnerId && pathname.startsWith(`/${partnerRole}`)) {
      window.localStorage.setItem(`partner:last-route:${membership.partnerId}`, pathname);
    }
  }, [membership?.partnerId, partnerRole, pathname]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => {
          searchRef.current?.focus();
        }, 0);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setAccountOpen(false);
        setOrganizationOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => {
      window.removeEventListener('keydown', onShortcut);
    };
  }, []);

  const visibleNavigation = useMemo(() => config.navigation.filter((item) => {
    const tabKey = item.label.toLowerCase().replace(/\s+/g, '-');
    if (auth.tabVisibility?.[tabKey] === false || auth.tabVisibility?.[item.label] === false) return false;
    if (item.permission && auth.grantedPermissions.length > 0 && !auth.grantedPermissions.includes(item.permission)) return false;
    return true;
  }), [auth.grantedPermissions, auth.tabVisibility, config.navigation]);

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
  const initials = initialsFrom(displayName);

  return (
    <div className={`partner-dashboard partner-dashboard--${partnerRole}`}>
      <a className="partner-skip-link" href="#partner-dashboard-content">
        Skip to dashboard content
      </a>
      <header className="partner-topbar">
        <div className="partner-brand-area">
          <Link href={`/${partnerRole}/overview`} className="partner-brand" aria-label="THE C1RCLE dashboard home" onClick={closeTransientUi}>
            <span className="partner-brand-mark" aria-hidden="true"><span /></span>
            <span className="partner-brand-copy"><strong>THE C1RCLE</strong><small>{config.eyebrow}</small></span>
          </Link>
          <button type="button" className="partner-organization-trigger" aria-label="Switch organization" aria-expanded={organizationOpen} onClick={() => { setOrganizationOpen((open) => !open); setNotificationsOpen(false); setAccountOpen(false); }}><span>{displayName}</span><small>{partnerRole}</small><b aria-hidden="true">⌄</b></button>
        </div>

        <nav className="partner-desktop-nav" aria-label={`${config.eyebrow} navigation`}>
          {visibleNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActiveRoute(pathname, item) ? 'is-active' : undefined}
              aria-current={isActiveRoute(pathname, item) ? 'page' : undefined}
              onClick={closeTransientUi}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="partner-topbar-actions">
          <button
            type="button"
            className="partner-icon-button partner-search-trigger"
            aria-label="Search dashboard"
            onClick={() => { setSearchOpen(true); }}
          >
            <span aria-hidden="true">⌕</span><kbd>⌘K</kbd>
          </button>
          <button
            type="button"
            className="partner-icon-button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setAccountOpen(false);
            }}
          >
            <span aria-hidden="true">◌</span><span className="partner-unread-dot" />
          </button>
          <Link href={config.primaryAction.href} className="partner-primary-action">
            <span aria-hidden="true">{config.primaryAction.icon === 'plus' ? '+' : '↗'}</span>
            {config.primaryAction.label}
          </Link>
          <button
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
            {initials}
          </button>
          <button
            type="button"
            className="partner-mobile-menu-button"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => { setMobileOpen((open) => !open); }}
          >
            <span /><span /><span />
          </button>
        </div>

        {notificationsOpen ? (
          <div className="partner-popover partner-notifications" role="dialog" aria-label="Notifications">
            <div className="partner-popover-heading"><strong>Notifications</strong><button type="button" onClick={() => { setNotificationsOpen(false); }}>Close</button></div>
            <article><span className="partner-notification-icon">₹</span><div><strong>Payout update</strong><p>Your latest settlement is ready to review.</p><time>12m ago</time></div></article>
            <article><span className="partner-notification-icon">✓</span><div><strong>Partnership accepted</strong><p>A new partner has joined your network.</p><time>1h ago</time></div></article>
            <article><span className="partner-notification-icon">↗</span><div><strong>Event momentum</strong><p>Your next event is converting above its weekly average.</p><time>3h ago</time></div></article>
          </div>
        ) : null}

        {accountOpen ? (
          <div className="partner-popover partner-account-popover" role="dialog" aria-label="Account menu">
            <div className="partner-account-identity"><span>{initials}</span><div><strong>{displayName}</strong><small>{membership?.role ?? 'owner'} · {partnerRole}</small></div></div>
            <Link href={`/${partnerRole}/settings`} onClick={closeTransientUi}>Profile & settings</Link>
            <button type="button" onClick={() => void auth.signOut()}>Sign out</button>
          </div>
        ) : null}
      </header>

      {organizationOpen ? <div className="partner-popover partner-organization-popover" role="dialog" aria-label="Switch organization"><div className="partner-popover-heading"><strong>Organizations</strong><button type="button" onClick={() => { setOrganizationOpen(false); }}>Close</button></div><div className="partner-organization-list">{auth.memberships.map((item) => { const role = item.partnerType === 'club' ? 'venue' : item.partnerType; const selected = item.partnerId === membership?.partnerId; return <button key={item.partnerId} type="button" disabled={selected} onClick={() => { window.localStorage.setItem(`partner:last-route:${item.partnerId}`, `/${role}/overview`); void auth.switchPartner(item.partnerId); }}><span>{initialsFrom(item.partnerName ?? role)}</span><div><strong>{item.partnerName ?? `${role} organization`}</strong><small>{role} · {item.role}</small></div>{selected ? <b>Active</b> : <b>Switch</b>}</button>; })}</div>{auth.memberships.length <= 1 ? <p className="partner-organization-empty">Additional organizations will appear here when the membership API returns them.</p> : null}</div> : null}

      {mobileOpen ? (
        <nav className="partner-mobile-nav" aria-label={`${config.eyebrow} mobile navigation`}>
          <div className="partner-mobile-identity"><span>{initials}</span><div><strong>{displayName}</strong><small>{config.eyebrow}</small></div></div>
          {visibleNavigation.map((item) => (
            <Link key={item.href} href={item.href} className={isActiveRoute(pathname, item) ? 'is-active' : undefined} onClick={closeTransientUi}>{item.label}<span aria-hidden="true">→</span></Link>
          ))}
          <Link href={config.primaryAction.href} className="partner-mobile-primary" onClick={closeTransientUi}>{config.primaryAction.label}</Link>
        </nav>
      ) : null}

      {searchOpen ? (
        <div className="partner-command-backdrop">
          <button type="button" className="partner-command-dismiss" aria-label="Close dashboard search" onClick={() => { setSearchOpen(false); }} />
          <section className="partner-command" role="dialog" aria-modal="true" aria-label="Search dashboard">
            <div className="partner-command-input"><span aria-hidden="true">⌕</span><input ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); }} placeholder={`Search ${config.eyebrow.toLowerCase()}`} aria-label="Search dashboard routes" /><button type="button" onClick={() => { setSearchOpen(false); }}>Esc</button></div>
            <div className="partner-command-results">
              <small>Quick navigation</small>
              {searchResults.map((item) => <Link key={item.href} href={item.href} onClick={closeTransientUi}><span>{item.label}</span><span aria-hidden="true">↗</span></Link>)}
              {searchResults.length === 0 ? <p>No matching dashboard pages.</p> : null}
            </div>
          </section>
        </div>
      ) : null}

      <main id="partner-dashboard-content" className="partner-dashboard-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
