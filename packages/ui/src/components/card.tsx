import { cn } from '@c1rcle/utils';

import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-(--shadow-card)',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('flex flex-col gap-1 p-6 pb-3', className)} {...props} />;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Required — a heading with no accessible content is a WCAG 1.3.1 failure. */
  readonly children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-base font-semibold', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pt-3', className)} {...props} />;
}
