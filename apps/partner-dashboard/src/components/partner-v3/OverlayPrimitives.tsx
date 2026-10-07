import { useEffect, useRef, type ReactNode } from 'react';

import { CloseIcon } from '@c1rcle/icons';

import { IconButton } from './IconButton';
import styles from './partner-v3.module.css';

export function Drawer({
  open,
  label,
  onClose,
  children,
}: {
  readonly open: boolean;
  readonly label: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles['overlayRoot']} role="presentation">
      <button
        type="button"
        className={styles['overlayScrim']}
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className={styles['drawer']} role="dialog" aria-modal="true" aria-label={label}>
        <div className={styles['drawerHeader']}>
          <span>{label}</span>
          <IconButton ref={closeButtonRef} label="Close navigation" onClick={onClose}>
            <CloseIcon size={18} aria-hidden="true" />
          </IconButton>
        </div>
        {children}
      </aside>
    </div>
  );
}
