import styles from './partner-v3.module.css';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly children: ReactNode;
}

export function Button({ variant = 'secondary', className, children, ...props }: ButtonProps) {
  const variantClass = {
    primary: styles['buttonPrimary'],
    secondary: styles['buttonSecondary'],
    ghost: styles['buttonGhost'],
    danger: styles['buttonDanger'],
  }[variant];

  return (
    <button
      className={[styles['button'], variantClass, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
