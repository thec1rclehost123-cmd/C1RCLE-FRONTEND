import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import styles from './partner-v3.module.css';

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { readonly label: string; readonly children: ReactNode }>(
  function IconButton({ label, children, className, ...props }, ref) {
    return (
      <button
        {...props}
        ref={ref}
        type={props.type ?? 'button'}
        aria-label={label}
        className={[styles['iconButton'], className].filter(Boolean).join(' ')}
      >
        {children}
      </button>
    );
  },
);
