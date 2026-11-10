'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './event-workspace.module.css';

import type { EventWorkspaceTab } from './EventWorkspaceChrome';

export function EventWorkspaceTabs({
  tabs,
  baseHref,
  level = 'both',
}: {
  readonly tabs: readonly EventWorkspaceTab[];
  readonly baseHref: string;
  readonly level?: 'primary' | 'secondary' | 'both';
}) {
  const pathname = usePathname();
  const matches = (href: string) =>
    pathname === href || (href !== baseHref && pathname.startsWith(`${href}/`));
  const active = tabs.find((tab) => (tab.children ?? [tab]).some((item) => matches(item.href)));
  return (
    <>
      {level !== 'secondary' ? (
        <nav className={styles['tabs']} aria-label="Event workspace">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active === tab ? 'page' : undefined}
              className={styles['tab']}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      ) : null}
      {level !== 'primary' && active?.children ? (
        <nav className={styles['contextTabs']} aria-label={`${active.label} sections`}>
          {active.children.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={matches(item.href) ? 'page' : undefined}
              className={styles['contextTab']}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}
