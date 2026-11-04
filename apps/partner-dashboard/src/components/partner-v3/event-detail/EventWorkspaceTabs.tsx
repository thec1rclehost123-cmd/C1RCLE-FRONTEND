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
  return (
    <nav className={styles['tabs']} aria-label="Event workspace">
      {tabs.map((tab) => {
        const selected =
          pathname === tab.href || (tab.href !== baseHref && pathname.startsWith(`${tab.href}/`));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={selected ? 'page' : undefined}
            className={styles['tab']}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
