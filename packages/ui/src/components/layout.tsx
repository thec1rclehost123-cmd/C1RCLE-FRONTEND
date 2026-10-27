import { cn } from '@c1rcle/utils';

import type { HTMLAttributes, ReactNode } from 'react';

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  readonly width?: 'content' | 'wide';
}

export function PageContainer({ width = 'content', className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        width === 'wide' ? 'max-w-[90rem]' : 'max-w-6xl',
        className,
      )}
      {...props}
    />
  );
}

export interface ResponsiveDataViewProps {
  readonly table: ReactNode;
  readonly mobile: ReactNode;
  readonly className?: string;
}

/** Keeps semantic tables on larger screens while requiring a deliberate mobile alternative. */
export function ResponsiveDataView({ table, mobile, className }: ResponsiveDataViewProps) {
  return (
    <div className={className}>
      <div className="hidden overflow-x-auto md:block">{table}</div>
      <div className="md:hidden">{mobile}</div>
    </div>
  );
}

export function SectionNavigation({
  label,
  children,
  className,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn('flex min-h-11 items-center gap-2 overflow-x-auto', className)}
    >
      {children}
    </nav>
  );
}
