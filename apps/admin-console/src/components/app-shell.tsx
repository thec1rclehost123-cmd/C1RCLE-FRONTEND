'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { logout, useSession } from '@c1rcle/auth';
import {
  AdminIcon,
  AnnouncementIcon,
  ApprovedIcon,
  BankIcon,
  CalendarIcon,
  CloseIcon,
  ComplianceIcon,
  DarkModeIcon,
  DashboardIcon,
  GuestIcon,
  InviteIcon,
  LightModeIcon,
  ListViewIcon,
  LocationIcon,
  MenuIcon,
  NotificationIcon,
  OrderIcon,
  PartnerIcon,
  RefundIcon,
  SearchIcon,
  SettingsIcon,
  SignalIcon,
  SignOutIcon,
  TicketIcon,
  TrendUpIcon,
  UsersIcon,
  WalletIcon,
  WarningIcon,
} from '@c1rcle/icons';
import { useTheme } from '@c1rcle/providers';

import { NAV_SECTIONS, APP_TITLE, APP_SHORT_TITLE } from '@/lib/app-meta';

import type { User } from '@c1rcle/contracts';
import type { IconProps } from '@c1rcle/icons';
import type { ComponentType, ReactNode } from 'react';

const HIDE_SHELL_PATHS = new Set(['/login']);

const ICONS: Readonly<Record<string, ComponentType<IconProps>>> = {
  dashboard: DashboardIcon,
  trend: TrendUpIcon,
  search: SearchIcon,
  approved: ApprovedIcon,
  invite: InviteIcon,
  compliance: ComplianceIcon,
  order: OrderIcon,
  ticket: TicketIcon,
  announcement: AnnouncementIcon,
  users: UsersIcon,
  wallet: WalletIcon,
  notification: NotificationIcon,
  refund: RefundIcon,
  warning: WarningIcon,
  bank: BankIcon,
  location: LocationIcon,
  calendar: CalendarIcon,
  guest: GuestIcon,
  partner: PartnerIcon,
  admin: AdminIcon,
  list: ListViewIcon,
  signal: SignalIcon,
  settings: SettingsIcon,
};

function initials(value: string): string {
  const local = value.split('@')[0] ?? value;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0]?.[0], parts[1]?.[0]] : [local[0], local[1]];
  return (
    letters
      .filter((letter): letter is string => Boolean(letter))
      .join('')
      .toUpperCase() || 'C1'
  );
}

export function AppShell({
  children,
  initialUser,
}: {
  readonly children: ReactNode;
  /**
   * The server's own read of the httpOnly session cookie (see
   * `getServerSession` in layout.tsx) — real proof of a session, not the
   * client-side store, which starts empty on every fresh load and would
   * otherwise let the full sidebar/nav render for a beat (or indefinitely,
   * for a visitor with no session at all) before any auth check catches up.
   * Server and first client render always agree on this value, so gating on
   * it here can never itself cause a hydration mismatch.
   */
  readonly initialUser: { user: User } | null;
}) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hideChrome = HIDE_SHELL_PATHS.has(pathname);
  const closeMobileNav = () => {
    setMobileOpen(false);
  };

  const unauthenticated = !hideChrome && initialUser === null;

  useEffect(() => {
    if (unauthenticated) {
      router.replace('/login');
    }
  }, [router, unauthenticated]);

  if (hideChrome) {
    return <>{children}</>;
  }

  if (unauthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Redirecting to sign in…
      </div>
    );
  }

  const activeItem = NAV_SECTIONS.flatMap((section) => section.items).find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
  );

  return (
    <div className="flex min-h-dvh">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => {
            setMobileOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      ) : null}

      <aside
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
          <Link href="/" onClick={closeMobileNav} className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-[0_0_20px_-4px_var(--color-primary)]">
              C1
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">THE C1RCLE</span>
              <span className="mt-0.5 text-xs text-muted-foreground">{APP_SHORT_TITLE}</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => {
              setMobileOpen(false);
            }}
            className="rounded-sm p-1 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <CloseIcon size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {section.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  const Icon = ICONS[item.icon] ?? DashboardIcon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeMobileNav}
                        aria-current={isActive ? 'page' : undefined}
                        className={`relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                          isActive
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        {isActive ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary"
                          />
                        ) : null}
                        <Icon size={17} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3 text-xs text-muted-foreground">
          Restricted · every action is audited
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileOpen(true);
            }}
            className="rounded-sm p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <MenuIcon size={20} aria-hidden="true" />
          </button>

          <div className="flex min-w-0 items-center gap-1.5 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{APP_TITLE}</span>
            <span className="hidden text-muted-foreground sm:inline" aria-hidden="true">
              /
            </span>
            <strong className="truncate font-medium">{activeItem?.label ?? 'Overview'}</strong>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {user === null ? null : (
              <span
                title={user.email}
                className="hidden items-center gap-1.5 rounded-full border border-border py-1 pl-1 pr-2.5 text-xs text-muted-foreground md:flex"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
                  {initials(user.email)}
                </span>
                <span className="max-w-[12rem] truncate">{user.email}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setTheme(isDark ? 'light' : 'dark');
              }}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {isDark ? (
                <LightModeIcon size={17} aria-hidden="true" />
              ) : (
                <DarkModeIcon size={17} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                void logout().then(() => {
                  router.replace('/login');
                });
              }}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <SignOutIcon size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
