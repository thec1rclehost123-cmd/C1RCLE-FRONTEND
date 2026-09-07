import Link from 'next/link';


import { Drawer } from './OverlayPrimitives';
import styles from './partner-v3.module.css';

import type { StudioConfig } from '@/studios/studio-config';

export function MobileNavigation({ config, pathname, open, onClose }: { readonly config: StudioConfig; readonly pathname: string; readonly open: boolean; readonly onClose: () => void }) {
  return (
    <Drawer open={open} label={`${config.label} navigation`} onClose={onClose}>
      <nav className={styles['mobileNav']}>
        {config.navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={[styles['navItem'], active ? styles['navItemActive'] : ''].filter(Boolean).join(' ')} aria-current={active ? 'page' : undefined} onClick={onClose}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </Drawer>
  );
}
