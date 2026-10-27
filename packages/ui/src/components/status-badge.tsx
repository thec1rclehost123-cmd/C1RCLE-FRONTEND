import { cn } from '@c1rcle/utils';

import type { HTMLAttributes } from 'react';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  info: 'border-primary/25 bg-primary/10 text-primary',
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-destructive/25 bg-destructive/10 text-destructive',
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly label: string;
  readonly tone?: StatusTone;
}

export function StatusBadge({ label, tone = 'neutral', className, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}
