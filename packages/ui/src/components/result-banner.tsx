import { cn } from '@c1rcle/utils';

import type { StatusTone } from './status-badge.js';
import type { ReactNode } from 'react';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-border bg-muted text-foreground',
  info: 'border-primary/25 bg-primary/10 text-foreground',
  success: 'border-success/25 bg-success/10 text-foreground',
  warning: 'border-warning/30 bg-warning/10 text-foreground',
  danger: 'border-destructive/25 bg-destructive/10 text-foreground',
};

export interface ResultBannerProps {
  readonly title: string;
  readonly description?: string;
  readonly tone?: StatusTone;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function ResultBanner({
  title,
  description,
  tone = 'info',
  action,
  className,
}: ResultBannerProps) {
  const urgent = tone === 'danger' || tone === 'warning';
  return (
    <section
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center',
        toneClasses[tone],
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}
