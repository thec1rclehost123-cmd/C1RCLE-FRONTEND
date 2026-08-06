import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@c1rcle/utils';

import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md',
    'font-medium transition-colors duration-(--duration-fast)',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-transparent hover:bg-muted',
        ghost: 'hover:bg-muted',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', fullWidth: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  readonly ref?: Ref<HTMLButtonElement>;
  /**
   * Renders a busy state. The button stays in the DOM and keeps its
   * accessible name, so screen readers announce the state change rather than
   * losing focus to a swapped-out node.
   */
  readonly isLoading?: boolean;
  readonly loadingLabel?: string;
  readonly children?: ReactNode;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  isLoading = false,
  loadingLabel = 'Loading',
  disabled = false,
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
      {isLoading ? <span className="sr-only">{loadingLabel}</span> : null}
    </button>
  );
}

export { buttonVariants };
