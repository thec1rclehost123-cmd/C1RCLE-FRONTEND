import { cn } from '@c1rcle/utils';

import { Button } from './button.js';

import type { ReactNode } from 'react';

/**
 * The three states every data-driven surface must handle.
 *
 * They live in the design system so that "loading", "empty" and "error" look
 * and behave identically in all three applications — and so that no feature
 * ships having quietly forgotten one of them.
 */

export interface LoadingStateProps {
  readonly label?: string;
  readonly className?: string;
}

export function LoadingState({ label = 'Loading…', className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-3 p-10', className)}
    >
      <span
        className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
        aria-hidden="true"
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-2 p-10 text-center', className)}
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description === undefined ? null : (
        <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      )}
      {action === undefined ? null : <div className="mt-2">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  readonly title?: string;
  /**
   * A message the user can act on. Never pass a raw exception message —
   * translate it via the `code` on an ApiClientError first.
   */
  readonly description: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  /** Shown in small print so support can correlate with backend logs. */
  readonly requestId?: string | undefined;
  readonly className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  requestId,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-3 p-10 text-center', className)}
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="max-w-prose text-sm text-muted-foreground">{description}</p>

      {onRetry === undefined ? null : (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}

      {requestId === undefined ? null : (
        <p className="text-xs text-muted-foreground/70">
          Reference: <code className="font-mono">{requestId}</code>
        </p>
      )}
    </div>
  );
}
