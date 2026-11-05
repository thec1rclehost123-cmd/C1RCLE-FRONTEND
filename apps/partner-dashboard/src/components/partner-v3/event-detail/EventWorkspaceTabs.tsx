'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './event-workspace.module.css';

import type { EventWorkspaceTab } from './EventWorkspaceChrome';

export function EventWorkspaceTabs({
  tabs,
  baseHref,
}: {
  readonly tabs: readonly EventWorkspaceTab[];
  readonly baseHref: string;
}) {
  const pathname = usePathname();
  const matches = (href: string) =>
    pathname === href || (href !== baseHref && pathname.startsWith(`${href}/`));
  const active = tabs.find((tab) => (tab.children ?? [tab]).some((item) => matches(item.href)));
  return (
    <>
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
      {active?.children ? (
        <nav className={styles['contextTabs']} aria-label={`${active.label} sections`}>
          {active.children.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={matches(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}
